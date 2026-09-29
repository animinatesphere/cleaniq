// End-to-end test of the admin Conversations API and tool-action logging on WhatsApp replies.
// Throwaway MongoDB; no WhatsApp message is actually sent.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
delete process.env.TWILIO_WHATSAPP_FROM; // any real send fails fast instead of reaching Twilio

const Admin = require("../../models/Admin");
const AiSettings = require("../../models/AiSettings");
const AiConversation = require("../../models/AiConversation");
const AiMessage = require("../../models/AiMessage");
const Service = require("../../models/Service");
const { handleIncoming } = require("../../utils/whatsapp");

let mongod, server, base, token;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await AiMessage.init();
  await Service.create({ name: "Deep Clean", region: "UK", rate: 30.85, type: "hourly", category: "Base" });
  const admin = await Admin.collection.insertOne({ username: "staff1", password: "x", role: "superadmin" });
  token = jwt.sign({ id: admin.insertedId.toString() }, process.env.JWT_SECRET, { algorithm: "HS256" });
  const app = express();
  app.use(express.json());
  app.use("/api/ai-receptionist", require("../../routes/aiReceptionist"));
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api/ai-receptionist`;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const api = async (method, path, body, auth = true) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};
const incoming = (sid, text, from = "whatsapp:+447700900123") =>
  ({ From: from, To: "whatsapp:+14155238886", Body: text, MessageSid: sid, NumMedia: "0", ProfileName: "Jane" });

test("admin login is required", async () => {
  assert.equal((await api("GET", "/conversations", null, false)).status, 401);
});

test("the AI's tool actions are saved on its WhatsApp reply", async () => {
  await AiSettings.get();
  await AiSettings.updateOne({ key: "default" }, { $set: { whatsappEnabled: true } });
  const sent = [];
  await handleIncoming(incoming("SM1", "How much for a 3 hour deep clean?"), {
    ai: async ({ runTool }) => {
      const q = await runTool("get_quote", { service: "Deep Clean", hours: 3 });
      return `That's £${q.total.toFixed(2)}.`;
    },
    send: async (to, body) => sent.push({ to, body }),
  });
  const reply = await AiMessage.findOne({ role: "ai" }).lean();
  assert.equal(reply.text, "That's £92.55.");
  assert.deepEqual(reply.tools, [{ name: "get_quote", ok: true, detail: "Price check: Deep Clean, 3h → £92.55" }]);
});

test("list, open (marks read), and see the messages with tool actions", async () => {
  const list = await api("GET", "/conversations");
  assert.equal(list.status, 200);
  assert.equal(list.data.length, 1);
  const c = list.data[0];
  assert.equal(c.phone, "+447700900123");
  assert.equal(c.name, "Jane");
  assert.equal(c.unreadCount, 1);
  assert.equal(c.replyWindowOpen, true);

  const detail = await api("GET", `/conversations/${c._id}`);
  assert.equal(detail.data.messages.length, 2);
  assert.equal(detail.data.messages[1].tools[0].detail, "Price check: Deep Clean, 3h → £92.55");
  assert.equal((await AiConversation.findById(c._id)).unreadCount, 0);

  assert.equal((await api("GET", "/conversations?q=jane")).data.length, 1);
  assert.equal((await api("GET", "/conversations?q=nobody")).data.length, 0);
});

test("take over, hand back to the AI (clears the flag), close", async () => {
  const c = await AiConversation.findOne();
  await AiConversation.updateOne({ _id: c._id }, { $set: { needsAttention: true } });
  let r = await api("POST", `/conversations/${c._id}/status`, { status: "human" });
  assert.equal(r.data.status, "human");
  assert.equal((await api("GET", "/conversations?status=human")).data.length, 1);
  assert.equal((await api("GET", "/conversations?attention=1")).data.length, 1);
  r = await api("POST", `/conversations/${c._id}/status`, { status: "ai" });
  assert.equal(r.data.status, "ai");
  assert.equal(r.data.needsAttention, false);
  r = await api("POST", `/conversations/${c._id}/status`, { status: "closed" });
  assert.equal(r.data.status, "closed");
  assert.equal((await api("POST", `/conversations/${c._id}/status`, { status: "weird" })).status, 400);
});

test("staff reply: takes the chat over, records the reply, reports a failed send", async () => {
  const c = await AiConversation.findOne();
  await AiConversation.updateOne({ _id: c._id }, { $set: { status: "ai" } });
  const r = await api("POST", `/conversations/${c._id}/reply`, { text: "Hi Jane, it's Sam from the team." });
  assert.equal(r.status, 502); // no WhatsApp sender configured in tests
  assert.match(r.data.message, /WhatsApp didn't accept the message/);
  const staffMsg = await AiMessage.findOne({ role: "staff" }).lean();
  assert.equal(staffMsg.text, "Hi Jane, it's Sam from the team.");
  assert.equal(staffMsg.deliveryStatus, "failed");
  assert.ok(staffMsg.staff);
  assert.equal((await AiConversation.findById(c._id)).status, "human");
  assert.equal((await api("POST", `/conversations/${c._id}/reply`, { text: "  " })).status, 400);
});

test("staff can't reply once WhatsApp's 24-hour window has closed", async () => {
  const c = await AiConversation.findOne();
  await AiConversation.updateOne({ _id: c._id }, { $set: { lastCustomerMessageAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
  const detail = await api("GET", `/conversations/${c._id}`);
  assert.equal(detail.data.conversation.replyWindowOpen, false);
  const r = await api("POST", `/conversations/${c._id}/reply`, { text: "Hello?" });
  assert.equal(r.status, 400);
  assert.match(r.data.message, /24-hour reply window has closed/);
});
