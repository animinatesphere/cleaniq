// The team is emailed when the AI receptionist finishes a phone call, and when a WhatsApp chat
// goes quiet after the AI's reply (once per stretch of chat). Throwaway MongoDB; emails captured.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.EMAIL_USER = "team@cleaniq.test";
const emails = [];
require("../../utils/emailService").sendEmail = async (m) => { emails.push(m); return true; };

const AiCall = require("../../models/AiCall");
const AiConversation = require("../../models/AiConversation");
const AiMessage = require("../../models/AiMessage");
const ScheduledTask = require("../../models/ScheduledTask");
const alerts = require("../../utils/aiFinishedAlerts");
const { processDueTasks } = require("../../utils/automationEngine");

let mongod;
test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
});
test.after(async () => { await mongoose.disconnect(); await mongod.stop(); });

const ago = (min) => new Date(Date.now() - min * 60000);

test("a finished call emails the team with what happened and a link to the Calls tab", async () => {
  const call = await AiCall.create({
    twilioCallSid: "CA-ALERT", phone: "+447700900123", customerName: "Ann Skinner", agentName: "John",
    startedAt: ago(4), endedAt: new Date(), endReason: "caller hung up",
    transcript: [
      { role: "ai", text: "Hello, you're speaking with John." },
      { role: "customer", text: "How much is a deep clean?" },
      { role: "ai", text: "Thirty pounds eighty-five an hour.", tools: [{ name: "save_enquiry", ok: true, detail: "Enquiry saved for Ann" }] },
    ],
  });
  emails.length = 0;
  await alerts.sendCallFinishedAlert(call._id);
  assert.equal(emails.length, 1);
  assert.equal(emails[0].to, "team@cleaniq.test");
  assert.match(emails[0].subject, /finished a call with Ann Skinner/);
  assert.match(emails[0].html, /admin\/ai\/calls/);
  assert.match(emails[0].html, /Enquiry saved for Ann/);
  assert.match(emails[0].html, /How much is a deep clean/);

  // Someone who rang off without saying anything: no email.
  const silent = await AiCall.create({ twilioCallSid: "CA-SILENT", phone: "+447700900999", transcript: [{ role: "ai", text: "Hello" }] });
  emails.length = 0;
  await alerts.sendCallFinishedAlert(silent._id);
  assert.equal(emails.length, 0);
});

test("a WhatsApp chat emails the team once, after it goes quiet — not while still chatting", async () => {
  const conv = await AiConversation.create({ phone: "+447700900555", name: "Tom Price" });
  const say = (role, text, min) => AiMessage.create({ conversation: conv._id, role, text, createdAt: ago(min), updatedAt: ago(min) });
  await say("customer", "Can I book a regular clean?", 3);
  await say("ai", "Of course — which day suits you?", 2);

  // One pending check per chat, pushed back on every reply.
  await alerts.scheduleChatFinishedAlert(conv._id);
  await alerts.scheduleChatFinishedAlert(conv._id);
  assert.equal(await ScheduledTask.countDocuments({ type: "ai_chat_finished", status: "pending" }), 1);

  // Due now, but the last message was only 2 minutes ago: still chatting, no email.
  emails.length = 0;
  await ScheduledTask.updateMany({ type: "ai_chat_finished" }, { runAt: ago(0.1) });
  await processDueTasks();
  assert.equal(emails.length, 0);

  // Quiet for 15 minutes: one email with a link to the Conversations tab.
  await AiMessage.updateMany({ conversation: conv._id }, [{ $set: { createdAt: { $subtract: ["$createdAt", 15 * 60000] } } }]);
  await alerts.sendChatFinishedAlert({ payload: { conversationId: String(conv._id) } });
  assert.equal(emails.length, 1);
  assert.match(emails[0].subject, /finished a WhatsApp chat with Tom Price/);
  assert.match(emails[0].html, /admin\/ai\/conversations/);

  // Running again with nothing new: no second email.
  await alerts.sendChatFinishedAlert({ payload: { conversationId: String(conv._id) } });
  assert.equal(emails.length, 1);
});
