// Blog: scheduled posts go live by themselves at their time; drafts never show; only admins can
// create, edit, delete or ask Claude for a draft.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const Admin = require("../../models/Admin");
const BlogPost = require("../../models/BlogPost");

let mongod, server, base, auth;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  auth = { Authorization: `Bearer ${jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" })}` };
  const app = express();
  app.use(express.json());
  app.use("/api/blog", require("../../routes/blog"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/blog`;
});
test.after(async () => {
  // Remove the test images the upload route saved.
  const fs = require("fs");
  const path = require("path");
  for (const p of await BlogPost.find({}, { image: 1 }).lean()) {
    if (/^\/uploads\/blog\/blog-/.test(p.image || "")) fs.rm(path.join(__dirname, "..", "..", p.image), { force: true }, () => {});
  }
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const png = () => new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" });
const create = (fields, headers = auth) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  fd.append("image", png(), "photo.png");
  return fetch(base, { method: "POST", headers, body: fd });
};
const publicTitles = async () => (await (await fetch(`${base}?limit=50`)).json()).posts.map((p) => p.title);

test("only admins can create, list all, edit or delete posts", async () => {
  assert.equal((await create({ title: "Hack", description: "x", status: "now" }, {})).status, 401);
  assert.equal((await fetch(`${base}/admin/all`)).status, 401);
  assert.equal((await fetch(`${base}/debug/all`)).status, 401);
  const p = await BlogPost.create({ title: "Keep", description: "d", image: "/x.png" });
  assert.equal((await fetch(`${base}/${p._id}`, { method: "DELETE" })).status, 401);
  assert.ok(await BlogPost.exists({ _id: p._id }));
  assert.equal((await fetch(`${base}/admin/ai-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 401);
});

test("publish now shows straight away; a draft never shows", async () => {
  const now = await create({ title: "Live now", description: "d", content: "Hi", status: "now" });
  assert.equal(now.status, 201);
  const draft = await (await create({ title: "Still a draft", description: "d", status: "draft" })).json();
  const titles = await publicTitles();
  assert.ok(titles.includes("Live now"));
  assert.ok(!titles.includes("Still a draft"));
  assert.equal((await fetch(`${base}/${draft._id}`)).status, 404, "a draft can't be opened by its link");
});

test("a scheduled post is hidden until its time, then goes live by itself", async () => {
  const at = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
  const res = await create({ title: "Spring cleaning tips", description: "d", status: "schedule", publishAt: at });
  assert.equal(res.status, 201);
  const post = await res.json();
  assert.equal(post.published, true);
  assert.equal(new Date(post.publishAt).toISOString(), at);
  assert.ok(!(await publicTitles()).includes("Spring cleaning tips"));
  assert.equal((await fetch(`${base}/${post._id}`)).status, 404, "not even by direct link before its time");
  // Time passes…
  await BlogPost.updateOne({ _id: post._id }, { $set: { publishAt: new Date(Date.now() - 1000) } });
  assert.ok((await publicTitles()).includes("Spring cleaning tips"));
  assert.equal((await fetch(`${base}/${post._id}`)).status, 200);

  // Admin's list shows it either way.
  const all = await (await fetch(`${base}/admin/all`, { headers: auth })).json();
  assert.ok(all.some((p) => p.title === "Spring cleaning tips"));
});

test("a time in the past can't be scheduled; the AI draft needs a topic", async () => {
  const past = await create({ title: "Oops", description: "d", status: "schedule", publishAt: new Date(Date.now() - 3600 * 1000).toISOString() });
  assert.equal(past.status, 400);
  assert.match((await past.json()).error, /in the past/);
  const ai = await fetch(`${base}/admin/ai-draft`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ topic: "hi" }) });
  assert.equal(ai.status, 400);
});

test("editing a scheduled post can reschedule it or publish it now", async () => {
  const post = await (await create({ title: "Move me", description: "d", status: "schedule", publishAt: new Date(Date.now() + 86400000).toISOString() })).json();
  const fd = new FormData();
  fd.append("status", "now");
  const res = await fetch(`${base}/${post._id}`, { method: "PUT", headers: auth, body: fd });
  assert.equal(res.status, 200);
  assert.ok(new Date((await res.json()).publishAt) <= new Date());
  assert.ok((await publicTitles()).includes("Move me"));
});
