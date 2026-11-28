// Cold email: admin login on every route; open/click tracking (security scanners ignored); A/B split;
// bounces, replies and out-of-office read from the mailbox (fake mailbox here); inbox answers;
// analytics. Sending is in dry-run mode: nothing is emailed.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.BACKEND_URL = "https://api.example.test";
process.env.COLD_EMAIL_DRY_RUN = "true";
delete process.env.ANTHROPIC_API_KEY; // keyword sorting of replies

let mongod, server, base, auth;
const M = (n) => require(`../../models/${n}`);

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  const admin = await M("Admin").collection.insertOne({ username: "boss", password: "x", role: "superadmin" });
  auth = { Authorization: `Bearer ${jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" })}` };
  const app = express();
  app.use(express.json());
  app.use("/api/cold-email", require("../../routes/cold-email"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/cold-email`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const api = (p, opts = {}, headers = auth) => fetch(`${base}${p}`, { redirect: "manual", ...opts, headers: { "Content-Type": "application/json", ...headers, ...(opts.headers || {}) } });
const ago = (min) => new Date(Date.now() - min * 60e3);
let campaign, mailbox, contacts;

test("every admin route needs the admin login; tracking and unsubscribe don't", async () => {
  for (const p of ["/campaigns", "/contacts", "/inbox", "/analytics", "/mailboxes", "/stats"]) assert.equal((await api(p, {}, {})).status, 401, p);
  assert.equal((await api("/campaigns")).status, 200);
  const px = await api("/t/o/nothing.gif", {}, {});
  assert.equal(px.status, 200);
  assert.equal(px.headers.get("content-type"), "image/gif");
  assert.equal((await api("/auth/google", {}, {})).status, 401, "connecting a mailbox needs the admin too");
});

test("tracking is added to the email: links go via our server (not unsubscribe), plus an open pixel", () => {
  const { addTracking, sign } = require("../../utils/coldTracking");
  const html = '<p>Hi <a href="https://www.cleaniqservices.com/get-a-quote?x=1&amp;y=2">get a quote</a> or <a href="mailto:a@b.c">email</a></p><a href="https://api.example.test/api/cold-email/unsubscribe/abc">Unsubscribe</a></body>';
  const out = addTracking(html, "TOK", { opens: true, clicks: true });
  assert.match(out, /href="https:\/\/api\.example\.test\/api\/cold-email\/t\/c\/TOK\?u=https%3A%2F%2Fwww\.cleaniqservices\.com%2Fget-a-quote%3Fx%3D1%26y%3D2&amp;s=/);
  assert.ok(out.includes(`s=${sign("TOK", "https://www.cleaniqservices.com/get-a-quote?x=1&y=2")}`));
  assert.ok(out.includes('href="mailto:a@b.c"'));
  assert.ok(out.includes('href="https://api.example.test/api/cold-email/unsubscribe/abc"'));
  assert.match(out, /<img src="https:\/\/api\.example\.test\/api\/cold-email\/t\/o\/TOK\.gif"[^>]*><\/body>$/);
  assert.equal(addTracking(html, "TOK", { opens: false, clicks: false }), html);
});

test("sending: A/B split, tracking token, 'sent' activity, contact moves to Contacted; bad addresses skipped", async () => {
  mailbox = await M("ColdMailbox").create({ email: "sam@cleaniqservices.com", provider: "gmail", dailyLimit: 100, warmupEnabled: false });
  contacts = await M("ColdContact").insertMany(
    Array.from({ length: 12 }, (_, i) => ({ email: `p${i}@example.org`, firstName: `P${i}` })).concat([{ email: "dead@nomail.invalid", verification: { status: "invalid", reason: "The domain has no mail server", checkedAt: new Date() } }]),
  );
  const res = await api("/campaigns", { method: "POST", body: JSON.stringify({
    name: "Landlords", fromName: "Sam", emailStyle: "plain",
    steps: [{ order: 0, subject: "Quick question {{firstName}}", subjectB: "Cleaning for your rentals, {{firstName}}?", body: "Hi {{firstName}}, see https://www.cleaniqservices.com", waitDays: 3 }, { order: 1, subject: "Following up", body: "Any thoughts?", waitDays: 3 }],
    mailboxIds: [mailbox._id], contactIds: contacts.map((c) => c._id),
  }) });
  campaign = await res.json();
  assert.equal(campaign.trackOpens, true);
  assert.equal((await api(`/campaigns/${campaign._id}/launch`, { method: "POST", body: "{}" })).status, 200);
  const { processSingleSend } = require("../../utils/coldEmailEngine");
  for (const s of await M("ColdSend").find({ campaignId: campaign._id, status: "pending" }).lean()) {
    await M("ColdMailbox").updateOne({ _id: mailbox._id }, { nextSendAt: null }); // skip the 4–9 min gap in tests
    await processSingleSend(s);
  }
  const sends = await M("ColdSend").find({ campaignId: campaign._id, stepIndex: 0 }).lean();
  const sent = sends.filter((s) => s.status === "sent");
  assert.equal(sent.length, 12);
  assert.ok(sent.every((s) => s.trackToken && s.trackToken.length >= 16));
  const b = sent.filter((s) => s.variant === "B").length;
  assert.ok(b > 0 && b < 12, `both versions used (B=${b})`);
  const dead = sends.find((s) => s.contactEmail === "dead@nomail.invalid");
  assert.equal(dead.status, "skipped");
  assert.match(dead.error, /can't receive mail/);
  assert.equal(await M("ColdEvent").countDocuments({ type: "sent", campaignId: campaign._id }), 12);
  assert.equal((await M("ColdContact").findOne({ email: "p0@example.org" })).stage, "contacted");
  assert.equal(await M("ColdSend").countDocuments({ campaignId: campaign._id, stepIndex: 1, status: "pending" }), 12, "follow-ups queued");
});

test("opens and clicks: scanners right after sending aren't counted; real ones are; bad link signatures are refused", async () => {
  const s0 = await M("ColdSend").findOne({ contactEmail: "p0@example.org", stepIndex: 0 });
  await api(`/t/o/${s0.trackToken}.gif`, {}, { "User-Agent": "Mozilla/5.0" });
  await new Promise((r) => setTimeout(r, 100));
  assert.equal((await M("ColdSend").findById(s0._id)).opens, 0, "within a minute of sending = probably a scanner");
  await M("ColdSend").updateMany({ campaignId: campaign._id, status: "sent" }, { sentAt: ago(30) });
  await api(`/t/o/${s0.trackToken}.gif`, {}, { "User-Agent": "Mozilla/5.0 (iPhone)" });
  await api(`/t/o/${s0.trackToken}.gif`, {}, { "User-Agent": "Mimecast URL Protect" });
  await new Promise((r) => setTimeout(r, 100));
  let s = await M("ColdSend").findById(s0._id);
  assert.equal(s.opens, 1);
  assert.equal((await M("ColdContact").findById(s0.contactId)).stage, "opened");
  const { sign } = require("../../utils/coldTracking");
  const url = "https://www.cleaniqservices.com/get-a-quote";
  const s1 = await M("ColdSend").findOne({ contactEmail: "p1@example.org", stepIndex: 0 });
  const click = await api(`/t/c/${s1.trackToken}?u=${encodeURIComponent(url)}&s=${sign(s1.trackToken, url)}`, {}, { "User-Agent": "Mozilla/5.0" });
  assert.equal(click.status, 302);
  assert.equal(click.headers.get("location"), url);
  s = await M("ColdSend").findById(s1._id);
  assert.equal(s.clicks, 1);
  assert.equal(s.opens, 1, "a click counts as an open");
  assert.equal((await api(`/t/c/${s1.trackToken}?u=${encodeURIComponent("https://evil.example")}&s=nope`, {}, {})).status, 400);
});

test("mailbox scan: bounce, real reply and out-of-office each handled; messages only read once", async () => {
  const inbox = require("../../utils/coldInbox");
  const send = (email) => M("ColdSend").findOne({ contactEmail: email, stepIndex: 0 });
  const [s2, s3, s4] = await Promise.all([send("p2@example.org"), send("p3@example.org"), send("p4@example.org")]);
  await M("ColdSend").updateOne({ _id: s3._id }, { gmailThreadId: "thread-3" });
  const messages = [
    { id: "m1", threadId: "thread-x", from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", to: mailbox.email, subject: "Delivery Status Notification (Failure)", body: "Address not found\nYour message wasn't delivered to p2@example.org because the address couldn't be found.\n550 5.1.1 The email account that you tried to reach does not exist.", headers: [{ name: "X-Failed-Recipients", value: "p2@example.org" }], internetMessageId: "<m1@x>", receivedAt: new Date() },
    { id: "m2", threadId: "thread-3", from: "P3 <p3@example.org>", to: mailbox.email, subject: "Re: Quick question P3", body: "Sounds good — please send me a quote for 3 flats.", headers: [], internetMessageId: "<m2@x>", receivedAt: new Date() },
    { id: "m3", threadId: "other", from: "P4 <p4@example.org>", to: mailbox.email, subject: "Automatic reply: Quick question P4", body: "I'm out of the office until Monday.", headers: [{ name: "Auto-Submitted", value: "auto-replied" }], internetMessageId: "<m3@x>", receivedAt: new Date() },
    { id: "m4", threadId: "random", from: "Someone <random@else.org>", to: mailbox.email, subject: "Hello", body: "Unrelated", headers: [], receivedAt: new Date() },
  ];
  inbox.adapters.gmail = async (mb, seen) => messages.filter((m) => !seen.has(m.id));
  const found = await inbox.scanAllMailboxes();
  assert.equal(found.bounces, 1);
  assert.equal(found.replies, 2);

  // Bounce: stopped, blocked, counted.
  const b = await M("ColdSend").findById(s2._id);
  assert.equal(b.status, "bounced");
  assert.equal(b.bounceType, "hard");
  assert.match(b.bounceReason, /5\.1\.1/);
  assert.ok(await M("ColdSuppressionList").exists({ email: "p2@example.org", reason: "bounced" }));
  assert.equal(await M("ColdSend").countDocuments({ contactEmail: "p2@example.org", status: "pending" }), 0);
  assert.equal((await M("ColdContact").findOne({ email: "p2@example.org" })).stage, "bounced");
  // Real reply: sorted, sequence stopped, stage set.
  const r = await M("ColdSend").findById(s3._id);
  assert.equal(r.status, "replied");
  assert.equal(r.replyCategory, "interested");
  assert.equal(await M("ColdSend").countDocuments({ contactEmail: "p3@example.org", status: "pending" }), 0);
  assert.equal((await M("ColdContact").findOne({ email: "p3@example.org" })).stage, "interested");
  // Out of office: saved, but the sequence carries on.
  const ooo = await M("ColdReply").findOne({ providerMessageId: "m3" });
  assert.equal(ooo.autoReply, true);
  assert.equal(await M("ColdSend").countDocuments({ contactEmail: "p4@example.org", status: "pending" }), 1);
  assert.equal((await M("ColdSend").findById(s4._id)).status, "sent");
  const c = await M("ColdCampaign").findById(campaign._id);
  assert.equal(c.stats.replied, 1);
  assert.equal(c.stats.bounced, 1);
  // Again: nothing new.
  const again = await inbox.scanAllMailboxes();
  assert.equal(again.checked, 0);
  assert.equal(await M("ColdReply").countDocuments(), 2);
});

test("inbox: real replies listed (out-of-office separate), full conversation, answer sent in the thread", async () => {
  const list = await (await api("/inbox")).json();
  assert.equal(list.threads.length, 1);
  assert.equal(list.threads[0].contact.email, "p3@example.org");
  assert.equal(list.threads[0].unread, 1);
  assert.equal(list.counts.interested.total, 1);
  assert.equal(list.counts.auto.total, 1);
  assert.equal((await (await api("/inbox?category=auto")).json()).threads[0].contact.email, "p4@example.org");
  const contactId = list.threads[0].contact._id;
  const convo = await (await api(`/inbox/contact/${contactId}`)).json();
  assert.deepEqual(convo.messages.map((m) => m.kind), ["sent", "reply"]);
  assert.match(convo.messages[0].subject, /P3/);
  assert.equal((await (await api("/inbox?unread=1")).json()).threads.length, 0, "opening it marks it read");
  const engine = require("../../utils/coldEmailEngine");
  let sentWith = null;
  engine.sendGmailReply = async (mb, opts) => { sentWith = opts; return { id: "g-out", threadId: "thread-3" }; };
  const ans = await api(`/inbox/contact/${contactId}/respond`, { method: "POST", body: JSON.stringify({ text: "Great — 3 flats would be £… I'll send the quote today." }) });
  assert.equal(ans.status, 200, await ans.clone().text());
  assert.equal(sentWith.threadId, "thread-3");
  assert.equal(sentWith.inReplyTo, "<m2@x>");
  assert.equal(sentWith.to, "p3@example.org");
  assert.deepEqual((await (await api(`/inbox/contact/${contactId}`)).json()).messages.map((m) => m.kind), ["sent", "reply", "answer"]);
});

test("analytics: funnel with rates, per step and A/B version, by day", async () => {
  const a = await (await api(`/campaigns/${campaign._id}/analytics`)).json();
  assert.equal(a.total.sent, 12);
  assert.equal(a.total.bounced, 1);
  assert.equal(a.total.delivered, 11);
  assert.equal(a.total.opened, 2);
  assert.equal(a.total.clicked, 1);
  assert.equal(a.total.replied, 1);
  assert.equal(a.total.interested, 1);
  assert.equal(a.total.replyRate, 9.1);
  assert.equal(a.steps[0].sent, 12);
  assert.deepEqual([...new Set(a.variants.map((v) => v.variant))].sort(), ["A", "B"]);
  assert.equal(a.daily.length, 30);
  const all = await (await api("/analytics")).json();
  assert.equal(all.campaigns[0].name, "Landlords");
  assert.equal(all.mailboxes[0].email, "sam@cleaniqservices.com");
  assert.equal(all.replyCategories.interested, 1);
  // Contact timeline.
  const p3 = await M("ColdContact").findOne({ email: "p3@example.org" });
  const act = await (await api(`/contacts/${p3._id}/activity`)).json();
  assert.ok(act.events.some((e) => e.type === "replied"));
  assert.equal((await (await api(`/contacts/${p3._id}/stage`, { method: "PATCH", body: JSON.stringify({ stage: "meeting" }) })).json()).stage, "meeting");
});

test("email check: bad format and throwaway services caught without sending anything", async () => {
  const { verifyEmail } = require("../../utils/coldVerify");
  assert.equal((await verifyEmail("not-an-email")).status, "invalid");
  assert.equal((await verifyEmail("x@mailinator.com")).status, "risky");
});
