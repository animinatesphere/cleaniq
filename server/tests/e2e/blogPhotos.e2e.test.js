// Blog: extra photos and before & after pairs. Only admins can upload; a post only keeps photos
// uploaded to our blog folder (never other addresses); edits replace the lists.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const Admin = require("../../models/Admin");
const BlogPost = require("../../models/BlogPost");

let mongod, server, base, auth;
const saved = [];

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
  for (const u of saved) fs.rm(path.join(__dirname, "..", "..", u), { force: true }, () => {});
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const png = () => new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" });
const upload = async (n, headers = auth) => {
  const fd = new FormData();
  for (let i = 0; i < n; i++) fd.append("photos", png(), `p${i}.png`);
  const r = await fetch(`${base}/admin/photos`, { method: "POST", headers, body: fd });
  const d = await r.json().catch(() => ({}));
  (d.urls || []).forEach((u) => saved.push(u));
  return { status: r.status, urls: d.urls || [] };
};

test("only admins can upload photos", async () => {
  assert.equal((await upload(1, {})).status, 401);
  const ok = await upload(3);
  assert.equal(ok.status, 200);
  assert.equal(ok.urls.length, 3);
  ok.urls.forEach((u) => assert.match(u, /^\/uploads\/blog\/blog-.+\.png$/));
});

test("a post saves its photos and pairs, and drops anything that isn't our upload", async () => {
  const { urls } = await upload(4);
  const fd = new FormData();
  fd.append("title", "Oven clean in Salford");
  fd.append("description", "d");
  fd.append("status", "now");
  fd.append("image", png(), "cover.png");
  fd.append("gallery", JSON.stringify([{ url: urls[0], caption: "Racks" }, { url: "https://evil.example/x.png", caption: "no" }, { url: "javascript:alert(1)" }]));
  fd.append("beforeAfter", JSON.stringify([{ before: urls[1], after: urls[2], caption: "Oven door" }, { before: urls[3], after: "/etc/passwd" }]));
  const r = await fetch(base, { method: "POST", headers: auth, body: fd });
  assert.equal(r.status, 201);
  const post = await r.json();
  saved.push(post.image);
  assert.deepEqual(post.gallery, [{ url: urls[0], caption: "Racks" }]);
  assert.deepEqual(post.beforeAfter, [{ before: urls[1], after: urls[2], caption: "Oven door" }]);

  // The public post includes them.
  const pub = await (await fetch(`${base}/slug/${post.slug}`)).json();
  assert.equal(pub.gallery.length, 1);
  assert.equal(pub.beforeAfter.length, 1);

  // Editing replaces the lists; leaving them out keeps them.
  const keep = new FormData();
  keep.append("title", "Oven clean in Salford (updated)");
  assert.equal((await fetch(`${base}/${post._id}`, { method: "PUT", headers: auth, body: keep })).status, 200);
  assert.equal((await BlogPost.findById(post._id)).gallery.length, 1);
  const edit = new FormData();
  edit.append("gallery", JSON.stringify([{ url: urls[3], caption: "" }, { url: urls[0], caption: "Racks" }]));
  edit.append("beforeAfter", "[]");
  assert.equal((await fetch(`${base}/${post._id}`, { method: "PUT", headers: auth, body: edit })).status, 200);
  const after = await BlogPost.findById(post._id).lean();
  assert.deepEqual(after.gallery.map((g) => g.url), [urls[3], urls[0]]);
  assert.equal(after.beforeAfter.length, 0);
});
