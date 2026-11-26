// Social media dashboard: logins, connecting Facebook/Instagram, LinkedIn and X, posting now and
// on a schedule (with photos), retries, X token refresh, and the autopilot (Claude + Unsplash).
// Every network, Unsplash and Claude are fake servers here: nothing reaches the real ones.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
let fake, fakeBase;
const calls = [];
const state = { xExpired: false, igStatus: "FINISHED" };

function startFake() {
  fake = http.createServer((req, res) => {
    let body = Buffer.alloc(0);
    req.on("data", (c) => { body = Buffer.concat([body, c]); });
    req.on("end", () => {
      const u = new URL(req.url, "http://x");
      const p = u.pathname;
      const text = body.toString("utf8");
      calls.push({ method: req.method, path: p, query: Object.fromEntries(u.searchParams), body: text, headers: req.headers });
      const send = (obj, status = 200, headers = {}) => { res.writeHead(status, { "Content-Type": "application/json", ...headers }); res.end(JSON.stringify(obj)); };
      // Meta
      if (p === "/v23.0/oauth/access_token") return send({ access_token: u.searchParams.get("grant_type") ? "long-user" : "short-user" });
      if (p === "/v23.0/me/accounts") return send({ data: [{ id: "PAGE1", name: "Cleaniq Services", access_token: "page-token", instagram_business_account: { id: "IG1", username: "cleaniq" } }] });
      if (p === "/v23.0/PAGE1/feed") return send({ id: "PAGE1_POST" });
      if (p === "/v23.0/PAGE1/photos") return send({ id: `PHOTO${calls.length}`, post_id: "PAGE1_PHOTOPOST" });
      if (p === "/v23.0/IG1/media") return send({ id: `CONT${calls.length}` });
      if (p === "/v23.0/IG1/media_publish") return send({ id: "IGMEDIA1" });
      if (/^\/v23\.0\/CONT\d+$/.test(p)) return send({ status_code: state.igStatus });
      if (p === "/v23.0/IGMEDIA1") return send({ permalink: "https://www.instagram.com/p/abc/" });
      // LinkedIn
      if (p === "/oauth/v2/accessToken") return send({ access_token: "li-token", expires_in: 5184000 });
      if (p === "/v2/userinfo") return send({ sub: "abc123", name: "Sam Owner" });
      if (p === "/rest/images") return send({ value: { uploadUrl: `${fakeBase}/li-upload/${calls.length}`, image: `urn:li:image:${calls.length}` } });
      if (p.startsWith("/li-upload/")) { res.writeHead(201); return res.end(); }
      if (p === "/rest/posts") { res.writeHead(201, { "x-restli-id": "urn:li:share:999" }); return res.end(); }
      // X
      if (p === "/2/oauth2/token") return send({ access_token: u.searchParams.get("grant_type") === "refresh_token" || /refresh_token/.test(text) ? "x-token-2" : "x-token", refresh_token: "x-refresh", expires_in: state.xExpired ? -10 : 7200 });
      if (p === "/2/users/me") return send({ data: { id: "X1", name: "Cleaniq", username: "cleaniq" } });
      if (p === "/2/media/upload") return send({ data: { id: `XM${calls.length}` } });
      if (p === "/2/tweets") return req.headers.authorization === "Bearer x-token-expired" ? send({ detail: "Unauthorized" }, 401) : send({ data: { id: "T1" } });
      // Google Business Profile
      if (p === "/token") return send({ access_token: /refresh_token/.test(text) ? "g-token-2" : "g-token", refresh_token: "g-refresh", expires_in: 3600 });
      if (p === "/v1/accounts") return send({ accounts: [{ name: "accounts/111" }] });
      if (p === "/v1/accounts/111/locations") return send({ locations: [{ name: "locations/222", title: "Cleaniq Services", storefrontAddress: { locality: "Manchester" } }] });
      if (p === "/v4/accounts/111/locations/222/localPosts") return send({ name: "accounts/111/locations/222/localPosts/9", searchUrl: "https://g.page/post/9" });
      // Threads
      if (p === "/oauth/access_token") return send({ access_token: "th-short", user_id: "TH1" });
      if (p === "/access_token") return send({ access_token: "th-long", expires_in: 5184000 });
      if (p === "/refresh_access_token") return send({ access_token: "th-long-2", expires_in: 5184000 });
      if (p === "/v1.0/me") return send({ id: "TH1", username: "cleaniq" });
      if (p === "/v1.0/TH1/threads") return send({ id: `THC${calls.length}` });
      if (/^\/v1\.0\/THC\d+$/.test(p)) return send({ status: "FINISHED" });
      if (p === "/v1.0/TH1/threads_publish") return send({ id: "THPOST" });
      if (p === "/v1.0/THPOST") return send({ permalink: "https://www.threads.net/@cleaniq/post/x" });
      // TikTok
      if (p === "/v2/oauth/token/") return send({ access_token: "tt-token", refresh_token: "tt-refresh", expires_in: 86400, open_id: "TT1" });
      if (p === "/v2/user/info/") return send({ data: { user: { open_id: "TT1", display_name: "Cleaniq" } } });
      if (p === "/v2/post/publish/creator_info/query/") return send({ data: { privacy_level_options: ["SELF_ONLY"] }, error: { code: "ok" } });
      if (p === "/v2/post/publish/content/init/") return send({ data: { publish_id: "PUB1" }, error: { code: "ok" } });
      // Pinterest
      if (p === "/v5/oauth/token") return send({ access_token: "pin-token", refresh_token: "pin-refresh", expires_in: 2592000 });
      if (p === "/v5/user_account") return send({ username: "cleaniq" });
      if (p === "/v5/boards") return send({ items: [{ id: "B1", name: "Before & after" }, { id: "B2", name: "Cleaning tips" }] });
      if (p === "/v5/pins") return send({ id: "PIN1" });
      // Video
      if (p === "/v23.0/PAGE1/videos") return send({ id: "FBVID1" });
      if (p === "/rest/videos" && u.searchParams.get("action") === "initializeUpload") return send({ value: { video: "urn:li:video:V1", uploadToken: "tok", uploadInstructions: [{ uploadUrl: `${fakeBase}/li-vupload`, firstByte: 0, lastByte: 99999999 }] } });
      if (p === "/li-vupload") { res.writeHead(200, { etag: "etag-1" }); return res.end(); }
      if (p === "/rest/videos" && u.searchParams.get("action") === "finalizeUpload") { res.writeHead(200); return res.end(); }
      if (p === "/2/media/upload/initialize") return send({ data: { id: "XV1" } });
      if (p === "/2/media/upload/XV1/append") { res.writeHead(204); return res.end(); }
      if (p === "/2/media/upload/XV1/finalize") return send({ data: { id: "XV1", processing_info: { state: "pending" } } });
      if (p === "/2/media/upload" && u.searchParams.get("command") === "STATUS") return send({ data: { id: "XV1", processing_info: { state: "succeeded" } } });
      if (p === "/v2/post/publish/video/init/") return send({ data: { publish_id: "VPUB1" }, error: { code: "ok" } });
      if (p === "/v5/media" && req.method === "POST") return send({ media_id: "M1", upload_url: `${fakeBase}/pin-upload`, upload_parameters: { key: "k1" } });
      if (p === "/pin-upload") { res.writeHead(204); return res.end(); }
      if (p === "/v5/media/M1") return send({ status: "succeeded" });
      if (p === "/youtube/v3/channels") return send({ items: [{ id: "UC1", snippet: { title: "Cleaniq Services", customUrl: "@cleaniq" } }] });
      if (p === "/upload/youtube/v3/videos") { res.writeHead(200, { location: `${fakeBase}/yt-session` }); return res.end(); }
      if (p === "/yt-session") return send({ id: "YT1", status: { privacyStatus: "private" } });
      // Unsplash
      if (p === "/search/photos") return send({ results: [{ user: { name: "Jane Doe" }, links: { download_location: `${fakeBase}/unsplash-dl` }, urls: { raw: `${fakeBase}/unsplash-img?x=1` } }] });
      if (p === "/unsplash-dl") return send({ url: "ok" });
      if (p === "/unsplash-img") { res.writeHead(200, { "Content-Type": "image/jpeg" }); return res.end(Buffer.from("ffd8ffe000", "hex")); }
      // Claude (Anthropic messages API)
      if (p === "/v1/messages") {
        const out = { text: "Spring is here — time for a deep clean!", facebook: "FB: Spring deep clean time.", instagram: "IG: Spring clean #Manchester #CleaningTips", linkedin: "LI: Spring cleaning for Manchester homes.", x: "X: Spring deep clean in Manchester", photo: "none", unsplashSearch: "spring cleaning" };
        return send({ id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify(out) }] });
      }
      send({ error: { message: `fake: no route ${p}` } }, 404);
    });
  });
  return new Promise((r) => fake.listen(0, () => { fakeBase = `http://127.0.0.1:${fake.address().port}`; r(); }));
}

let mongod, server, base, adminAuthH;
const Admin = () => require("../../models/Admin");
const made = [];

test.before(async () => {
  await startFake();
  Object.assign(process.env, {
    META_APP_ID: "meta-id", META_APP_SECRET: "meta-secret", META_GRAPH_URL: fakeBase, META_DIALOG_URL: fakeBase,
    LINKEDIN_CLIENT_ID: "li-id", LINKEDIN_CLIENT_SECRET: "li-secret", LINKEDIN_API_URL: fakeBase, LINKEDIN_AUTH_URL: fakeBase,
    X_CLIENT_ID: "x-id", X_CLIENT_SECRET: "x-secret", X_API_URL: fakeBase, X_AUTH_URL: fakeBase,
    GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-secret", GOOGLE_AUTH_URL: fakeBase, GOOGLE_TOKEN_URL: fakeBase, GBP_ACCOUNTS_URL: fakeBase, GBP_INFO_URL: fakeBase, GBP_POSTS_URL: fakeBase,
    THREADS_APP_ID: "th-id", THREADS_APP_SECRET: "th-secret", THREADS_AUTH_URL: fakeBase, THREADS_API_URL: fakeBase,
    TIKTOK_CLIENT_KEY: "tt-key", TIKTOK_CLIENT_SECRET: "tt-secret", TIKTOK_AUTH_URL: fakeBase, TIKTOK_API_URL: fakeBase,
    YOUTUBE_API_URL: fakeBase, YOUTUBE_UPLOAD_URL: fakeBase,
    PINTEREST_APP_ID: "pin-id", PINTEREST_APP_SECRET: "pin-secret", PINTEREST_AUTH_URL: fakeBase, PINTEREST_API_URL: fakeBase,
    UNSPLASH_ACCESS_KEY: "u-key", UNSPLASH_API_URL: fakeBase,
    ANTHROPIC_API_KEY: "test-key", ANTHROPIC_BASE_URL: fakeBase,
    PUBLIC_API_URL: "https://api.example.test", SOCIAL_APP_URL: "https://site.example.test/social", SOCIAL_IG_POLL_MS: "10",
  });
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await Admin().collection.insertOne({ username: "boss", password: "x", role: "superadmin" });
  adminAuthH = { Authorization: `Bearer ${jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" })}` };
  const app = express();
  app.use("/api/social", require("../../routes/social"));
  app.get("/api/admin-only", require("../../middleware/adminAuth"), (req, res) => res.json({ ok: true }));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/social`;
});
test.after(async () => {
  const dir = path.join(__dirname, "..", "..", "uploads", "social");
  for (const f of made) fs.rm(path.join(dir, path.basename(f)), { force: true }, () => {});
  server.close();
  fake.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const api = (p, opts = {}, auth = adminAuthH) => fetch(`${base}${p}`, { ...opts, headers: { ...(opts.body && typeof opts.body === "string" ? { "Content-Type": "application/json" } : {}), ...auth, ...(opts.headers || {}) }, redirect: "manual" });
const jsonOf = async (r) => r.json();
const connect = async (network) => {
  const { url } = await jsonOf(await api(`/connect/${network}/start`, { method: "POST" }));
  const st = new URL(url).searchParams.get("state");
  return api(`/connect/${network}/callback?code=abc&state=${st}`, {}, {});
};
let socialToken;

test("logins: social users can't use the main admin or manage logins; admins can", async () => {
  assert.equal((await api("/accounts", {}, {})).status, 401);
  const made1 = await api("/users", { method: "POST", body: JSON.stringify({ name: "Ava", email: "ava@example.com", password: "long-password-1" }) });
  assert.equal(made1.status, 201);
  const login = await jsonOf(await fetch(`${base}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ava@example.com", password: "long-password-1" }) }));
  socialToken = { Authorization: `Bearer ${login.token}` };
  assert.equal((await api("/accounts", {}, socialToken)).status, 200);
  assert.equal((await api("/users", {}, socialToken)).status, 403);
  const adminRoute = await fetch(`${base.replace("/social", "")}/admin-only`, { headers: socialToken });
  assert.equal(adminRoute.status, 401);
  assert.equal((await fetch(`${base}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ava@example.com", password: "wrong" }) })).status, 400);
});

test("connecting Facebook adds the Page and its Instagram; tokens are stored encrypted", async () => {
  const r = await connect("meta");
  assert.equal(r.status, 302);
  assert.match(r.headers.get("location"), /^https:\/\/site\.example\.test\/social\?connected=2#accounts$/);
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  assert.deepEqual(accounts.map((a) => a.network).sort(), ["facebook", "instagram"]);
  assert.ok(accounts.every((a) => !("token" in a)));
  const raw = await require("../../models/SocialAccount").findOne({ network: "facebook" }).lean();
  assert.ok(raw.token && !raw.token.includes("page-token"));
  // A used or made-up state is refused.
  const again = await api("/connect/meta/callback?code=abc&state=nope", {}, {});
  assert.match(again.headers.get("location"), /error=/);
});

test("connecting LinkedIn and X", async () => {
  assert.match((await connect("linkedin")).headers.get("location"), /connected=1/);
  assert.match((await connect("x")).headers.get("location"), /connected=1/);
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  assert.equal(accounts.length, 4);
  const xCall = calls.find((c) => c.path === "/2/oauth2/token");
  assert.match(xCall.body, /code_verifier=/);
});

let photoRefs = [];
test("photo library: upload JPEGs; other files refused", async () => {
  const fd = new FormData();
  const jpg = Buffer.from("ffd8ffe000104a464946", "hex");
  fd.append("photos", new Blob([jpg], { type: "image/jpeg" }), "kitchen.jpg");
  fd.append("photos", new Blob([jpg], { type: "image/jpeg" }), "oven.jpg");
  fd.append("description", "Kitchen after a deep clean");
  const r = await api("/photos", { method: "POST", body: fd }, socialToken);
  assert.equal(r.status, 201);
  photoRefs = (await r.json()).map((p) => p.ref);
  made.push(...photoRefs);
  const lib = await jsonOf(await api("/photos", {}, socialToken));
  assert.equal(lib.uploaded.length, 2);
  assert.ok(lib.ours.length > 0, "our own job photos are in the library");
  const bad = new FormData();
  bad.append("photos", new Blob(["<svg/>"], { type: "image/svg+xml" }), "x.svg");
  assert.equal((await api("/photos", { method: "POST", body: bad }, socialToken)).status, 400);
});

test("post now to every network with two photos", async () => {
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  calls.length = 0;
  const r = await api("/posts", { method: "POST", body: JSON.stringify({ text: "Fresh and clean (really) #Manchester", variants: { x: "Short for X" }, images: photoRefs, accounts: accounts.map((a) => a._id), action: "now" }) }, socialToken);
  assert.equal(r.status, 201);
  const post = await r.json();
  assert.equal(post.status, "posted", JSON.stringify(post.results));
  assert.equal(post.results.length, 4);
  // Facebook: two unpublished photos then one post with both attached.
  const fbPhotos = calls.filter((c) => c.path === "/v23.0/PAGE1/photos");
  assert.equal(fbPhotos.length, 2);
  assert.ok(fbPhotos.every((c) => /published=false/.test(c.body) && /url=https%3A%2F%2Fapi\.example\.test%2Fuploads%2Fsocial%2F/.test(c.body)));
  assert.match(calls.find((c) => c.path === "/v23.0/PAGE1/feed").body, /attached_media%5B1%5D/);
  // Instagram: carousel of two, then publish.
  assert.ok(calls.some((c) => c.path === "/v23.0/IG1/media" && /media_type=CAROUSEL/.test(c.body)));
  assert.ok(calls.some((c) => c.path === "/v23.0/IG1/media_publish"));
  assert.equal(post.results.find((x) => x.network === "instagram").url, "https://www.instagram.com/p/abc/");
  // LinkedIn: two uploads, multi-image post, escaped text with a real hashtag.
  const li = JSON.parse(calls.find((c) => c.path === "/rest/posts").body);
  assert.equal(li.author, "urn:li:person:abc123");
  assert.equal(li.content.multiImage.images.length, 2);
  assert.equal(li.commentary, "Fresh and clean \\(really\\) {hashtag|\\#|Manchester}");
  // X: its own wording and two photos.
  const tw = JSON.parse(calls.find((c) => c.path === "/2/tweets").body);
  assert.equal(tw.text, "Short for X");
  assert.equal(tw.media.media_ids.length, 2);
});

test("Instagram needs a photo; a PNG fails only for Instagram (partial)", async () => {
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  const ig = accounts.find((a) => a.network === "instagram")._id;
  const fb = accounts.find((a) => a.network === "facebook")._id;
  assert.equal((await api("/posts", { method: "POST", body: JSON.stringify({ text: "No photo", accounts: [ig], action: "now" }) }, socialToken)).status, 400);
  const png = new FormData();
  png.append("photos", new Blob([Buffer.from("89504e470d0a1a0a", "hex")], { type: "image/png" }), "a.png");
  const ref = (await (await api("/photos", { method: "POST", body: png }, socialToken)).json())[0].ref;
  made.push(ref);
  const post = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "PNG", images: [ref], accounts: [ig, fb], action: "now" }) }, socialToken));
  assert.equal(post.status, "partial");
  assert.match(post.results.find((r) => r.network === "instagram").error, /JPEG/);
  // Retry only tries the failed account again.
  calls.length = 0;
  const retried = await jsonOf(await api(`/posts/${post._id}/retry`, { method: "POST" }, socialToken));
  assert.equal(retried.status, "partial");
  assert.ok(!calls.some((c) => c.path.startsWith("/v23.0/PAGE1")), "Facebook isn't posted twice");
});

test("scheduled posts go out once, when due", async () => {
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  const fb = accounts.find((a) => a.network === "facebook")._id;
  assert.equal((await api("/posts", { method: "POST", body: JSON.stringify({ text: "Later", accounts: [fb], action: "schedule", scheduledAt: new Date(Date.now() - 3600e3).toISOString() }) }, socialToken)).status, 400);
  const post = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "Later", accounts: [fb], action: "schedule", scheduledAt: new Date(Date.now() + 3600e3).toISOString() }) }, socialToken));
  assert.equal(post.status, "scheduled");
  const { publishDue } = require("../../utils/socialScheduler");
  assert.equal((await publishDue(new Date())).length, 0, "not due yet");
  const done = await publishDue(new Date(Date.now() + 2 * 3600e3));
  assert.equal(done.length, 1);
  assert.equal(done[0].status, "posted");
  assert.equal((await publishDue(new Date(Date.now() + 3 * 3600e3))).length, 0, "never twice");
});

test("an expired X token is refreshed before posting", async () => {
  const SocialAccount = require("../../models/SocialAccount");
  await SocialAccount.updateOne({ network: "x" }, { expiresAt: new Date(Date.now() - 1000) });
  const x = (await jsonOf(await api("/accounts", {}, socialToken))).find((a) => a.network === "x")._id;
  calls.length = 0;
  const post = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "Hi X", accounts: [x], action: "now" }) }, socialToken));
  assert.equal(post.status, "posted");
  assert.ok(calls.some((c) => c.path === "/2/oauth2/token" && /grant_type=refresh_token/.test(c.body)));
  assert.equal(calls.find((c) => c.path === "/2/tweets").headers.authorization, "Bearer x-token-2");
});

test("autopilot: Claude writes, Unsplash photo when ours don't fit, posts by itself on schedule", async () => {
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  assert.equal((await api("/autopilots", { method: "POST", body: JSON.stringify({ name: "Tips", enabled: true, instructions: "", accounts: [], days: [1], times: ["09:00"] }) }, socialToken)).status, 400);
  const ap = await jsonOf(await api("/autopilots", { method: "POST", body: JSON.stringify({ name: "Weekly tips", enabled: true, instructions: "Share a seasonal cleaning tip for Manchester homes.", accounts: accounts.map((a) => a._id), days: [0, 1, 2, 3, 4, 5, 6], times: ["09:00", "18:00"] }) }, socialToken));
  assert.ok(ap.nextRunAt && new Date(ap.nextRunAt) > new Date());
  // Preview: a draft, nothing posted.
  calls.length = 0;
  const draft = await jsonOf(await api(`/autopilots/${ap._id}/preview`, { method: "POST" }, socialToken));
  assert.equal(draft.status, "draft");
  assert.equal(draft.variants.x, "X: Spring deep clean in Manchester");
  assert.equal(draft.credit, "Photo: Jane Doe on Unsplash");
  assert.match(draft.images[0], /^\/uploads\/social\/unsplash-/);
  made.push(draft.images[0]);
  assert.ok(calls.some((c) => c.path === "/unsplash-dl"), "Unsplash download is reported");
  assert.ok(!calls.some((c) => c.path === "/2/tweets"));
  // Due: posts by itself to all four, X text gets the credit, next run moves on.
  const SocialAutopilot = require("../../models/SocialAutopilot");
  await SocialAutopilot.updateOne({ _id: ap._id }, { nextRunAt: new Date(Date.now() - 1000) });
  calls.length = 0;
  await require("../../utils/socialScheduler").runDueAutopilots(new Date());
  const after = await SocialAutopilot.findById(ap._id).lean();
  assert.match(after.lastResult, /Posted to 4 of 4/);
  assert.ok(after.nextRunAt > new Date());
  const post = await require("../../models/SocialPost").findById(after.lastPost).lean();
  made.push(...post.images);
  assert.equal(post.source, "autopilot");
  assert.equal(JSON.parse(calls.find((c) => c.path === "/2/tweets").body).text, "X: Spring deep clean in Manchester\n\nPhoto: Jane Doe on Unsplash");
});

test("next run: chosen weekdays and UK times", () => {
  const { nextRunAfter } = require("../../utils/socialScheduler");
  // Wednesday 2026-07-01 10:00 UK (09:00 UTC, summer time). Mondays & Fridays at 08:30.
  const next = nextRunAfter({ days: [1, 5], times: ["08:30"] }, new Date("2026-07-01T09:00:00Z"));
  assert.equal(next.toISOString(), "2026-07-03T07:30:00.000Z"); // Friday 08:30 BST
  const winter = nextRunAfter({ days: [1], times: ["08:30"] }, new Date("2026-12-01T12:00:00Z"));
  assert.equal(winter.toISOString(), "2026-12-07T08:30:00.000Z"); // Monday 08:30 GMT
  assert.equal(nextRunAfter({ days: [], times: ["08:30"] }), null);
});

test("Google Business Profile, Threads, TikTok and Pinterest: connect and post with photos", async () => {
  for (const n of ["google", "threads", "tiktok", "pinterest"]) assert.match((await connect(n)).headers.get("location"), /connected=\d/, n);
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  const mine = accounts.filter((a) => ["google", "threads", "tiktok", "pinterest"].includes(a.network));
  assert.deepEqual(mine.map((a) => a.network).sort(), ["google", "pinterest", "pinterest", "threads", "tiktok"], "each Pinterest board is its own account");
  assert.equal(mine.find((a) => a.network === "google").name, "Cleaniq Services");
  const ids = mine.filter((a) => a.network !== "pinterest" || a.name === "Before & after").map((a) => a._id);
  // TikTok and Pinterest need a photo.
  assert.equal((await api("/posts", { method: "POST", body: JSON.stringify({ text: "Hi", accounts: ids, action: "now" }) }, socialToken)).status, 400);
  calls.length = 0;
  const post = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "Spotless kitchen in Salford\nBefore & after from today. #Manchester", variants: { threads: "Threads wording" }, images: photoRefs, accounts: ids, action: "now" }) }, socialToken));
  assert.equal(post.status, "posted", JSON.stringify(post.results));
  const g = JSON.parse(calls.find((c) => c.path === "/v4/accounts/111/locations/222/localPosts").body);
  assert.equal(g.media.length, 2);
  assert.match(g.media[0].sourceUrl, /^https:\/\/api\.example\.test\/uploads\/social\//);
  assert.ok(calls.some((c) => c.path === "/v1.0/TH1/threads" && /media_type=CAROUSEL/.test(c.body) && /text=Threads\+wording/.test(c.body)));
  const tt = JSON.parse(calls.find((c) => c.path === "/v2/post/publish/content/init/").body);
  assert.equal(tt.media_type, "PHOTO");
  assert.equal(tt.post_info.privacy_level, "SELF_ONLY");
  assert.equal(tt.source_info.photo_images.length, 2);
  assert.match(post.results.find((r) => r.network === "tiktok").note, /private/);
  const pin = JSON.parse(calls.find((c) => c.path === "/v5/pins").body);
  assert.equal(pin.board_id, "B1");
  assert.equal(pin.title, "Spotless kitchen in Salford");
  assert.equal(pin.media_source.source_type, "multiple_image_urls");
  // Running-out tokens are renewed first (Google: refresh token; Threads: a week ahead).
  const SocialAccount = require("../../models/SocialAccount");
  await SocialAccount.updateMany({ network: { $in: ["google", "threads"] } }, { expiresAt: new Date(Date.now() + 60e3) });
  calls.length = 0;
  const again = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "Again", accounts: mine.filter((a) => ["google", "threads"].includes(a.network)).map((a) => a._id), action: "now" }) }, socialToken));
  assert.equal(again.status, "posted", JSON.stringify(again.results));
  assert.ok(calls.some((c) => c.path === "/token" && /grant_type=refresh_token/.test(c.body)));
  assert.ok(calls.some((c) => c.path === "/refresh_access_token"));
  assert.equal(calls.find((c) => c.path === "/v4/accounts/111/locations/222/localPosts").headers.authorization, "Bearer g-token-2");
});

test("video: upload an MP4 and post it to every network (YouTube too)", async () => {
  assert.match((await connect("youtube")).headers.get("location"), /connected=1/);
  const fd = new FormData();
  fd.append("photos", new Blob([Buffer.alloc(2048, 7)], { type: "video/mp4" }), "clean.mp4");
  const up = await api("/photos", { method: "POST", body: fd }, socialToken);
  assert.equal(up.status, 201);
  const [vid] = await up.json();
  made.push(vid.ref);
  assert.equal(vid.kind, "video");
  const accounts = await jsonOf(await api("/accounts", {}, socialToken));
  const all = accounts.filter((a) => a.network !== "pinterest" || a.name === "Before & after");
  const ids = all.map((a) => a._id);
  // YouTube needs a video; Pinterest video pins need a cover photo.
  assert.equal((await api("/posts", { method: "POST", body: JSON.stringify({ text: "x", images: photoRefs, accounts: [all.find((a) => a.network === "youtube")._id], action: "now" }) }, socialToken)).status, 400);
  assert.equal((await api("/posts", { method: "POST", body: JSON.stringify({ text: "x", video: vid.ref, accounts: [all.find((a) => a.network === "pinterest")._id], action: "now" }) }, socialToken)).status, 400);
  calls.length = 0;
  const post = await jsonOf(await api("/posts", { method: "POST", body: JSON.stringify({ text: "Watch this oven clean\nFrom grime to shine. #Manchester", video: vid.ref, images: [photoRefs[0]], accounts: ids, action: "now" }) }, socialToken));
  assert.equal(post.status, "posted", JSON.stringify(post.results ? post.results.filter((r) => r.status !== "posted") : post));
  assert.equal(post.results.length, ids.length);
  const has = (path, re) => calls.some((c) => c.path === path && (!re || re.test(c.body)));
  assert.ok(has("/v23.0/PAGE1/videos", /file_url=https%3A%2F%2Fapi\.example\.test%2Fuploads%2Fsocial%2F.+\.mp4/), "Facebook video");
  assert.ok(has("/v23.0/IG1/media", /media_type=REELS/), "Instagram Reel");
  assert.ok(has("/li-vupload") && has("/rest/videos") && JSON.parse(calls.find((c) => c.path === "/rest/posts").body).content.media.id === "urn:li:video:V1", "LinkedIn video");
  assert.equal(JSON.parse(calls.find((c) => c.path === "/2/tweets").body).media.media_ids[0], "XV1", "X video");
  assert.ok(has("/2/media/upload"), "X waits for processing");
  assert.ok(has("/v1.0/TH1/threads", /media_type=VIDEO/), "Threads video");
  assert.match(JSON.parse(calls.find((c) => c.path === "/v2/post/publish/video/init/").body).source_info.video_url, /\.mp4$/, "TikTok video");
  const pin = JSON.parse(calls.find((c) => c.path === "/v5/pins").body);
  assert.equal(pin.media_source.source_type, "video_id");
  assert.match(pin.media_source.cover_image_url, /^https:\/\/api\.example\.test\/uploads\/social\//);
  assert.ok(has("/yt-session"), "YouTube upload");
  assert.match(JSON.parse(calls.find((c) => c.path === "/upload/youtube/v3/videos").body).snippet.title, /^Watch this oven clean$/);
  assert.match(post.results.find((r) => r.network === "youtube").note, /private/);
  // Google Business: text only, with a note.
  const g = JSON.parse(calls.find((c) => c.path === "/v4/accounts/111/locations/222/localPosts").body);
  assert.equal(g.media, undefined);
  assert.match(post.results.find((r) => r.network === "google").note, /can't include video/);
});
