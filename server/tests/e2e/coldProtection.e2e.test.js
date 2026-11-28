// Cold email protection (Apollo-style): risky addresses, one campaign at a time, same-company spacing,
// auto-pause on bounces, broken sign-ins marked "Reconnect needed" without losing emails, paused
// campaigns keep their emails, SMTP/IMAP mailboxes (fake servers), domains / protection / bounce log /
// alerts pages.
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.BACKEND_URL = "https://api.example.test";
process.env.COLD_EMAIL_DRY_RUN = "true";
delete process.env.ANTHROPIC_API_KEY;

let mongod, server, base, auth;
const M = (n) => require(`../../models/${n}`);
const api = (p, opts = {}) => fetch(`${base}${p}`, { ...opts, headers: { "Content-Type": "application/json", ...auth, ...(opts.headers || {}) } });
const engine = () => require("../../utils/coldEmailEngine");
const free = (id) => M("ColdMailbox").updateOne({ _id: id }, { nextSendAt: null });

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniqprot");
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

async function makeCampaign(name, mailboxId, contacts, steps = [{ order: 0, subject: "Hi {{first_name|there}}", body: "Hello", waitDays: 0 }]) {
  const c = await (await api("/campaigns", { method: "POST", body: JSON.stringify({ name, fromName: "Sam", emailStyle: "plain", steps, mailboxIds: [mailboxId], contactIds: contacts.map((x) => x._id) }) })).json();
  assert.equal((await api(`/campaigns/${c._id}/launch`, { method: "POST", body: "{}" })).status, 200);
  return c;
}
async function sendAll(campaignId, mailboxId) {
  for (const s of await M("ColdSend").find({ campaignId, status: "pending" }).lean()) {
    await free(mailboxId);
    await engine().processSingleSend(s);
  }
}

test("who gets emailed: risky skipped (when on), no second campaign, same company spaced out", async () => {
  const box = await M("ColdMailbox").create({ email: "a@cleaniqservices.com", dailyLimit: 500, warmupEnabled: false });
  const ppl = await M("ColdContact").insertMany([
    { email: "info@shop.co.uk", firstName: "Info", verification: { status: "risky" } },
    { email: "ann@bigco.co.uk", firstName: "Ann" },
    { email: "bob@bigco.co.uk", firstName: "Bob" },
    { email: "cat@gmail.com", firstName: "Cat" },
    { email: "dan@gmail.com", firstName: "Dan" },
  ]);
  assert.equal((await (await api("/protection", { method: "PUT", body: JSON.stringify({ skipRisky: true }) })).json()).skipRisky, true);

  const c1 = await makeCampaign("First", box._id, ppl);
  await sendAll(c1._id, box._id);
  const s1 = Object.fromEntries((await M("ColdSend").find({ campaignId: c1._id }).lean()).map((s) => [s.contactEmail, s]));
  assert.equal(s1["info@shop.co.uk"].status, "skipped");
  assert.match(s1["info@shop.co.uk"].error, /role address/);
  const bigco = [s1["ann@bigco.co.uk"], s1["bob@bigco.co.uk"]];
  assert.equal(bigco.filter((s) => s.status === "sent").length, 1, "one person at bigco gets it now");
  const held = bigco.find((s) => s.status === "pending");
  assert.ok(held.scheduledAt > new Date(Date.now() + 23 * 3600e3), "the other waits about a day");
  assert.match(held.error, /bigco\.co\.uk was emailed recently/);
  assert.equal(s1["cat@gmail.com"].status, "sent");
  assert.equal(s1["dan@gmail.com"].status, "sent", "gmail.com isn't one company");

  // A second campaign doesn't start on people the first one emailed this month.
  const c2 = await makeCampaign("Second", box._id, [ppl[3], await M("ColdContact").create({ email: "eve@other.org", firstName: "Eve" })]);
  await sendAll(c2._id, box._id);
  const s2 = Object.fromEntries((await M("ColdSend").find({ campaignId: c2._id }).lean()).map((s) => [s.contactEmail, s]));
  assert.equal(s2["cat@gmail.com"].status, "skipped");
  assert.match(s2["cat@gmail.com"].error, /already emailed by another campaign \("First"\)/);
  assert.equal(s2["eve@other.org"].status, "sent");

  const prot = await (await api("/protection")).json();
  assert.equal(prot.summary.riskyHeld, 1);
  assert.equal(prot.summary.otherCampaign, 1);
  assert.ok(prot.summary.spacedOut >= 1);
  await api("/protection", { method: "PUT", body: JSON.stringify({ skipRisky: false, companySpacingHours: 0, oneCampaignAtATime: false }) });
});

test("pausing a campaign keeps its emails; resume carries on", async () => {
  const box = await M("ColdMailbox").create({ email: "p@cleaniqservices.com", dailyLimit: 500, warmupEnabled: false });
  const ppl = await M("ColdContact").insertMany([{ email: "x1@pause.org" }, { email: "x2@pause.org" }]);
  const c = await makeCampaign("Pausable", box._id, ppl);
  await api(`/campaigns/${c._id}/pause`, { method: "POST" });
  for (const s of await M("ColdSend").find({ campaignId: c._id }).lean()) assert.equal(await engine().processSingleSend(s), "wait");
  assert.equal(await M("ColdSend").countDocuments({ campaignId: c._id, status: "pending" }), 2, "still waiting, not cancelled");
  await api(`/campaigns/${c._id}/resume`, { method: "POST" });
  await sendAll(c._id, box._id);
  assert.equal(await M("ColdSend").countDocuments({ campaignId: c._id, status: "sent" }), 2);
});

test("broken sign-in: mailbox marked 'Reconnect needed', the email waits instead of failing; alert shown", async () => {
  delete process.env.COLD_EMAIL_DRY_RUN;
  const { encrypt } = engine();
  const box = await M("ColdMailbox").create({ email: "broken@cleaniqservices.com", provider: "smtp", dailyLimit: 500, warmupEnabled: false, smtp: { host: "smtp.example.test", port: 465, user: "broken@cleaniqservices.com", pass: encrypt("old") } });
  const smtp = require("../../utils/coldSmtp");
  const real = smtp.lib.createTransport;
  smtp.lib.createTransport = () => ({ sendMail: async () => { const e = new Error("Invalid login: 535 Authentication failed"); e.code = "EAUTH"; throw e; }, close() {} });
  try {
    const ppl = await M("ColdContact").insertMany([{ email: "z@broken.org" }]);
    const c = await makeCampaign("Broken box", box._id, ppl);
    const s = await M("ColdSend").findOne({ campaignId: c._id }).lean();
    await free(box._id);
    const err = await engine().processSingleSend(s).then(() => null, (e) => e);
    assert.equal(err?.signIn, true);
    await engine().handleSendError(s, err);
    const after = await M("ColdMailbox").findById(box._id).lean();
    assert.equal(after.status, "error");
    assert.match(after.errorMessage, /password was refused/);
    const waiting = await M("ColdSend").findOne({ campaignId: c._id }).lean();
    assert.equal(waiting.status, "pending");
    assert.match(waiting.error, /needs reconnecting/);
    // Nothing else is sent from it until it's reconnected.
    await free(box._id);
    await engine().processSingleSend({ ...waiting, scheduledAt: new Date() });
    assert.equal((await M("ColdSend").findById(waiting._id).lean()).status, "pending");
    const { alerts } = await (await api("/alerts")).json();
    assert.ok(alerts.some((a) => a.kind === "reconnect" && a.title.includes("broken@cleaniqservices.com")));
  } finally {
    smtp.lib.createTransport = real;
    process.env.COLD_EMAIL_DRY_RUN = "true";
  }
});

test("too many bounces: mailbox and campaign paused automatically, shown in alerts and bounce log", async () => {
  const box = await M("ColdMailbox").create({ email: "b@cleaniqservices.com", dailyLimit: 500, warmupEnabled: false });
  const ppl = await M("ColdContact").insertMany(Array.from({ length: 20 }, (_, i) => ({ email: `n${i}@bounce${i}.org` })));
  const c = await makeCampaign("Bouncy", box._id, ppl);
  await sendAll(c._id, box._id);
  const inbox = require("../../utils/coldInbox");
  const real = inbox.adapters.gmail;
  inbox.adapters.gmail = async () => ["n1", "n2"].map((n, i) => ({
    id: `b${i}`, threadId: `t${i}`, from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", to: box.email,
    subject: "Delivery Status Notification (Failure)", body: `Address not found\n550 5.1.1 The email account that you tried to reach does not exist: ${n}@bounce${n.slice(1)}.org`,
    headers: [{ name: "X-Failed-Recipients", value: `${n}@bounce${n.slice(1)}.org` }], receivedAt: new Date(),
  }));
  try {
    const r = await inbox.scanMailbox(await M("ColdMailbox").findById(box._id));
    assert.equal(r.bounces, 2);
  } finally {
    inbox.adapters.gmail = real;
  }
  const mb = await M("ColdMailbox").findById(box._id).lean();
  assert.equal(mb.status, "paused");
  assert.match(mb.pausedReason, /5% of emails bounced/, "paused at the first bounce: 1 of 20 = 5% > 3%");
  assert.equal((await M("ColdCampaign").findById(c._id).lean()).status, "paused");
  const { alerts } = await (await api("/alerts")).json();
  assert.ok(alerts.some((a) => a.kind === "mailbox_paused"));
  assert.ok(alerts.some((a) => a.kind === "campaign_paused"));
  const log = await (await api("/bounces")).json();
  assert.equal(log.total, 2);
  assert.equal(log.bounces[0].type, "hard");
  assert.match(log.bounces[0].reason, /5\.1\.1/);
  assert.equal(log.bounces[0].campaign, "Bouncy");
  // Resuming clears the reason.
  await api(`/mailboxes/${box._id}`, { method: "PATCH", body: JSON.stringify({ status: "active" }) });
  assert.equal((await M("ColdMailbox").findById(box._id).lean()).pausedReason, "");
});

test("SMTP mailbox: details checked before saving, password never returned, sends through SMTP, IMAP replies matched", async () => {
  const smtp = require("../../utils/coldSmtp");
  const realT = smtp.lib.createTransport;
  const realI = smtp.lib.openImap;
  const sent = [];
  let good = "right-pass";
  smtp.lib.createTransport = (o) => ({
    verify: async () => { if (o.auth.pass !== good) { const e = new Error("535 Authentication failed"); e.code = "EAUTH"; throw e; } },
    sendMail: async (m) => { sent.push({ o, m }); return { messageId: m.messageId || "<r@x>" }; },
    close() {},
  });
  smtp.lib.openImap = () => ({ connect: async () => {}, logout: async () => {} });
  delete process.env.COLD_EMAIL_DRY_RUN;
  try {
    const bad = await api("/mailboxes/smtp", { method: "POST", body: JSON.stringify({ email: "kel@cleaniqservice.com", host: "smtpout.secureserver.net", port: 465, password: "wrong", imapHost: "imap.secureserver.net" }) });
    assert.equal(bad.status, 400);
    assert.match((await bad.json()).message, /password was refused/);
    const ok = await api("/mailboxes/smtp", { method: "POST", body: JSON.stringify({ email: "kel@cleaniqservice.com", fromName: "Kelvin", host: "smtpout.secureserver.net", port: 465, password: good, imapHost: "imap.secureserver.net" }) });
    assert.equal(ok.status, 200);
    const box = await ok.json();
    assert.equal(box.provider, "smtp");
    assert.equal(box.smtp.pass, undefined);
    assert.equal(box.smtp.hasPassword, true);
    const stored = await M("ColdMailbox").findById(box._id).lean();
    assert.notEqual(stored.smtp.pass, good, "stored encrypted");
    await M("ColdMailbox").updateOne({ _id: box._id }, { warmupEnabled: false, dailyLimit: 100 });

    const ppl = await M("ColdContact").insertMany([{ email: "lea@client.org", firstName: "Lea" }]);
    const c = await makeCampaign("Via SMTP", box._id, ppl);
    await sendAll(c._id, box._id);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].o.host, "smtpout.secureserver.net");
    assert.equal(sent[0].o.auth.pass, good);
    assert.deepEqual(sent[0].m.from, { name: "Sam", address: "kel@cleaniqservice.com" });
    assert.match(sent[0].m.headers["List-Unsubscribe"], /unsubscribe/);
    const s = await M("ColdSend").findOne({ campaignId: c._id }).lean();
    assert.equal(s.status, "sent");
    assert.equal(s.gmailThreadId, sent[0].m.messageId);

    // A reply read by IMAP that answers that Message-ID.
    const inbox = require("../../utils/coldInbox");
    const realA = inbox.adapters.smtp;
    inbox.adapters.smtp = async () => [{ id: "1:7", threadId: s.gmailThreadId, threadIds: [s.gmailThreadId], from: "Lea <lea@client.org>", to: box.email, subject: "Re: Hi Lea", body: "Yes please, send a quote", headers: [], internetMessageId: "<lea1@client.org>", receivedAt: new Date() }];
    try {
      const r = await inbox.scanMailbox(await M("ColdMailbox").findById(box._id));
      assert.equal(r.replies, 1);
    } finally {
      inbox.adapters.smtp = realA;
    }
    assert.equal((await M("ColdSend").findById(s._id).lean()).status, "replied");

    // Answer from the admin inbox goes by SMTP, in the thread.
    const ans = await api(`/inbox/contact/${ppl[0]._id}/respond`, { method: "POST", body: JSON.stringify({ text: "Great, quote attached" }) });
    assert.equal(ans.status, 200);
    const last = sent[sent.length - 1].m;
    assert.equal(last.inReplyTo, "<lea1@client.org>");
    assert.equal(last.subject, "Re: Hi Lea");
  } finally {
    smtp.lib.createTransport = realT;
    smtp.lib.openImap = realI;
    process.env.COLD_EMAIL_DRY_RUN = "true";
  }
});

test("domains page: mailboxes grouped by domain with stats and problems", async () => {
  const d = await (await api("/domains")).json();
  const csc = d.domains.find((x) => x.domain === "cleaniqservices.com");
  assert.ok(csc.mailboxes.length >= 3);
  const broken = csc.mailboxes.find((m) => m.email === "broken@cleaniqservices.com");
  assert.equal(broken.needsReconnect, true);
  assert.ok(broken.issues.some((i) => i.level === "bad"));
  assert.equal(csc.status, "attention");
  const a = csc.mailboxes.find((m) => m.email === "a@cleaniqservices.com");
  assert.ok(a.stats.sent >= 4);
  assert.equal(a.smtp, undefined);
  assert.ok(d.domains.some((x) => x.domain === "cleaniqservice.com"));
});
