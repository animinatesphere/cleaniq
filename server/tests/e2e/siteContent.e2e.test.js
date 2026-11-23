// Website content editing: content editor logins (/content-admin) can edit website text and
// nothing else; main admins manage the accounts; drafts keep versions; Publish commits the page's
// content file to GitHub (a fake GitHub here: nothing reaches the real one).
// Throwaway MongoDB.
//
//   node --test tests/e2e/siteContent.e2e.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.GITHUB_TOKEN = "test-token";
process.env.GITHUB_REPO = "owner/site";
process.env.GITHUB_BRANCH = "main";

// A fake GitHub repository (nothing is sent to the real GitHub).
const repo = {
  "src/content/services/carpet-cleaning-manchester.json": { sha: "sha-1", data: { basics: { heading: "Carpet Cleaning in Manchester" } } },
  "src/content/locations/salford.json": { sha: "sha-a", data: { basics: { tagline: "Salford" } } },
};
const commits = [];
const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (!u.startsWith("https://api.github.com/repos/owner/site/contents/")) return realFetch(url, opts);
  assert.equal(opts.headers.Authorization, "Bearer test-token");
  const path = decodeURIComponent(u.split("/contents/")[1].split("?")[0]);
  const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  if ((opts.method || "GET") === "GET") {
    if (path === "src/content/services" || path === "src/content/locations") {
      return json(200, Object.keys(repo).filter((k) => k.startsWith(path + "/")).map((k) => ({ type: "file", name: k.split("/").pop() })));
    }
    const f = repo[path];
    if (!f) return json(404, { message: "Not Found" });
    return json(200, { sha: f.sha, content: Buffer.from(JSON.stringify(f.data)).toString("base64") });
  }
  const body = JSON.parse(opts.body);
  const f = repo[path];
  if (!f || body.sha !== f.sha) return json(409, { message: "sha does not match" });
  commits.push({ path, message: body.message, author: body.author, branch: body.branch });
  f.data = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"));
  f.sha = f.sha + "+";
  return json(200, { content: { sha: f.sha }, commit: { sha: "c" + commits.length, html_url: "https://github.com/owner/site/commit/c" + commits.length } });
};
const Admin = require("../../models/Admin");

let mongod, server, base, adminToken;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin.create({ username: "boss", password: "x".repeat(60), email: "boss@test.com" });
  // issued just after the account was created (creating it sets passwordChangedAt to now)
  adminToken = jwt.sign({ id: admin._id, iat: Math.floor(Date.now() / 1000) + 5 }, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET, { expiresIn: "1h" });
  const app = express();
  app.use(express.json());
  app.use("/api/site-content", require("../../routes/siteContent"));
  app.use("/api/content-editors", require("../../routes/contentEditors"));
  // a main-admin-only route, to prove content editor tokens can't use it
  app.get("/api/admin-only", require("../../middleware/adminAuth"), (req, res) => res.json({ ok: true }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); await mongod.stop(); });

const call = (method, path, { token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }));

let editorToken, editorId;

test("only main admins can create content editor accounts", async () => {
  assert.equal((await call("POST", "/content-editors", { body: { name: "Sam", email: "sam@test.com", password: "longenough1" } })).status, 401);
  assert.equal((await call("POST", "/content-editors", { token: adminToken, body: { name: "Sam", email: "sam@test.com", password: "short" } })).status, 400);
  const r = await call("POST", "/content-editors", { token: adminToken, body: { name: "Sam", email: "Sam@Test.com", password: "longenough1" } });
  assert.equal(r.status, 201);
  assert.equal(r.data.email, "sam@test.com");
  assert.equal(r.data.password, undefined);
  editorId = r.data._id;
});

test("content editors sign in with their own login", async () => {
  assert.equal((await call("POST", "/content-editors/login", { body: { email: "sam@test.com", password: "wrong-password" } })).status, 400);
  const r = await call("POST", "/content-editors/login", { body: { email: "sam@test.com", password: "longenough1" } });
  assert.equal(r.status, 200);
  editorToken = r.data.token;
  assert.equal((await call("GET", "/content-editors/me", { token: editorToken })).data.editor.email, "sam@test.com");
});

test("a content editor token can't use the main admin", async () => {
  assert.equal((await call("GET", "/admin-only", { token: editorToken })).status, 401);
  assert.equal((await call("GET", "/content-editors", { token: editorToken })).status, 401);
  assert.equal((await call("GET", "/admin-only", { token: adminToken })).status, 200);
});

test("the page list and each page's text come from GitHub", async () => {
  assert.equal((await call("GET", "/site-content/pages")).status, 401);
  const list = await call("GET", "/site-content/pages", { token: editorToken });
  assert.deepEqual(list.data.services.map((x) => x.key), ["service:carpet-cleaning-manchester"]);
  assert.deepEqual(list.data.locations.map((x) => x.key), ["location:salford"]);
  const page = await call("GET", "/site-content/service:carpet-cleaning-manchester", { token: editorToken });
  assert.equal(page.data.file.basics.heading, "Carpet Cleaning in Manchester");
  assert.equal(page.data.sha, "sha-1");
  assert.equal(page.data.draft, null);
  assert.equal((await call("GET", "/site-content/service:..%2F..%2Fsecrets", { token: editorToken })).status, 400);
});

test("drafts are saved and kept as versions; odd keys are dropped", async () => {
  const k = "/site-content/service:carpet-cleaning-manchester";
  assert.equal((await call("PUT", k, { token: editorToken, body: { data: { basics: { heading: "Draft one" } } } })).status, 200);
  assert.equal((await call("PUT", k, { token: adminToken, body: { data: { basics: { heading: "Draft two" }, $where: "x", "bad key": 1 } } })).status, 200);
  const page = await call("GET", k, { token: editorToken });
  assert.deepEqual(page.data.draft, { basics: { heading: "Draft two" } });
  assert.equal(page.data.draftSavedBy, "boss@test.com");
  assert.equal(page.data.history.length, 1);
  const restored = await call("POST", k + "/restore", { token: editorToken, body: { index: 0 } });
  assert.equal(restored.data.data.basics.heading, "Draft one");
  assert.equal((await call("GET", "/site-content/pages", { token: editorToken })).data.services[0].hasDraft, true);
});

test("publish commits the file to GitHub main with the editor's name, and clears the draft", async () => {
  const k = "/site-content/service:carpet-cleaning-manchester";
  const data = { basics: { heading: "Carpet cleaners in Manchester" } };
  const r = await call("POST", k + "/publish", { token: editorToken, body: { data, sha: "sha-1" } });
  assert.equal(r.status, 200);
  assert.match(r.data.commitUrl, /github.com/);
  assert.equal(commits.length, 1);
  assert.equal(commits[0].path, "src/content/services/carpet-cleaning-manchester.json");
  assert.equal(commits[0].branch, "main");
  assert.deepEqual(commits[0].author, { name: "Sam", email: "sam@test.com" });
  assert.match(commits[0].message, /carpet-cleaning-manchester/);
  assert.equal(repo["src/content/services/carpet-cleaning-manchester.json"].data.basics.heading, "Carpet cleaners in Manchester");
  const page = await call("GET", k, { token: editorToken });
  assert.equal(page.data.draft, null);
  assert.match(page.data.history[0].savedBy, /published/);
});

test("publishing over a newer GitHub version is refused, so nothing is overwritten", async () => {
  const r = await call("POST", "/site-content/service:carpet-cleaning-manchester/publish", { token: editorToken, body: { data: { a: "1" }, sha: "sha-1" } });
  assert.equal(r.status, 409);
  assert.match(r.data.message, /changed on GitHub/);
  assert.equal(commits.length, 1);
});

test("without GitHub settings, the editor explains what's missing", async () => {
  const saved = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  const r = await call("GET", "/site-content/pages", { token: editorToken });
  process.env.GITHUB_TOKEN = saved;
  assert.equal(r.status, 503);
  assert.match(r.data.message, /GITHUB_TOKEN/);
});

test("disabled or removed editors are signed out", async () => {
  await call("PATCH", `/content-editors/${editorId}`, { token: adminToken, body: { active: false } });
  assert.equal((await call("GET", "/content-editors/me", { token: editorToken })).status, 401);
  assert.equal((await call("POST", "/content-editors/login", { body: { email: "sam@test.com", password: "longenough1" } })).status, 400);
  await call("DELETE", `/content-editors/${editorId}`, { token: adminToken });
  assert.equal((await call("GET", "/content-editors", { token: adminToken })).data.length, 0);
});
