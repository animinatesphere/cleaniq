// End-to-end test of the phone receptionist: Twilio webhooks + the ConversationRelay WebSocket,
// with a fake AI and a throwaway MongoDB. Nothing calls Twilio or an AI provider.
//
//   node --test tests/e2e/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const express = require("express");
const twilio = require("twilio");
const { WebSocketServer, WebSocket } = require("ws");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.TWILIO_ACCOUNT_SID = "ACtest";
process.env.TWILIO_AUTH_TOKEN = "tok123";

const AiSettings = require("../../models/AiSettings");
const AiCall = require("../../models/AiCall");
const Service = require("../../models/Service");
const { handleRelaySession, RELAY_PATH } = require("../../utils/voice");

let mongod, server, base;
let fakeAi = async () => "Hello!";

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri() + "cleaniq");
  await Service.create({ name: "Deep Clean", region: "UK", rate: 30.85, type: "hourly", category: "Base" });

  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/voice", require("../../routes/voice"));
  server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: RELAY_PATH });
  wss.on("connection", (ws) => handleRelaySession(ws, { ai: (...a) => fakeAi(...a), speakDelay: () => 20 }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
  process.env.PUBLIC_API_URL = base;
});
test.after(async () => {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
});

const setSettings = async (s) => {
  await AiSettings.get();
  await AiSettings.updateOne({ key: "default" }, { $set: s });
};
const twilioPost = (path, params, { sign = true } = {}) => {
  const url = base + path;
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (sign) headers["X-Twilio-Signature"] = twilio.getExpectedTwilioSignature("tok123", url, params);
  return fetch(url, { method: "POST", headers, body: new URLSearchParams(params) });
};
const callParams = (sid) => ({ CallSid: sid, From: "+447700900123", To: "+441610000000" });

// Opens a relay socket, sends setup, and collects what we send back to "Twilio".
async function openSession(token, callSid) {
  const ws = new WebSocket(base.replace("http", "ws") + RELAY_PATH);
  const received = [];
  let closed = null;
  ws.on("message", (m) => received.push(JSON.parse(String(m))));
  ws.on("close", (code) => (closed = code));
  await new Promise((r) => ws.on("open", r));
  ws.send(JSON.stringify({ type: "setup", callSid, from: "+447700900123", to: "+441610000000", customParameters: { token } }));
  return { ws, received, closed: () => closed };
}
const waitFor = async (fn, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("timed out waiting");
};
async function incomingToken(callSid) {
  const res = await twilioPost("/api/voice/incoming", callParams(callSid));
  const body = await res.text();
  const m = body.match(/<Parameter name="token" value="([0-9a-f]+)"\/>/);
  return { res, body, token: m && m[1] };
}

test("unsigned webhooks are rejected", async () => {
  const res = await twilioPost("/api/voice/incoming", callParams("CA0"), { sign: false });
  assert.equal(res.status, 403);
});

test("voice AI off → call goes straight to the team (or a polite message)", async () => {
  await setSettings({ voiceEnabled: false, transferNumber: "+447911000111" });
  let body = await (await twilioPost("/api/voice/incoming", callParams("CA1"))).text();
  assert.match(body, /<Dial>\+447911000111<\/Dial>/);
  await setSettings({ transferNumber: "" });
  body = await (await twilioPost("/api/voice/incoming", callParams("CA2"))).text();
  assert.match(body, /<Say language="en-GB">Sorry, we can't take your call/);
});

test("voice AI on → ConversationRelay in British English with greeting and a one-time token", async () => {
  await setSettings({ voiceEnabled: true, transferNumber: "+447911000111" });
  const { body, token } = await incomingToken("CA3");
  assert.match(body, /<Connect action="http:\/\/127\.0\.0\.1:\d+\/api\/voice\/after">/);
  assert.match(body, /<ConversationRelay url="ws:\/\/127\.0\.0\.1:\d+\/api\/voice\/relay" language="en-GB"/);
  assert.match(body, /welcomeGreeting="Hello, thank you for calling Cleaniq Services, you&apos;re speaking with Brenda\. Calls are transcribed/);
  assert.ok(token);
});

test("a session with a wrong or reused token is closed", async () => {
  const s = await openSession("not-a-real-token", "CA4");
  await waitFor(() => s.closed() === 1008);
  const { token } = await incomingToken("CA5");
  const first = await openSession(token, "CA5");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA5" }));
  const reused = await openSession(token, "CA5");
  await waitFor(() => reused.closed() === 1008);
  first.ws.close();
});

test("caller speaks → AI replies (using a tool) → transcript and tool action are saved", async () => {
  fakeAi = async ({ history, tools, runTool }) => {
    assert.ok(tools.some((t) => t.name === "get_quote"));
    assert.ok(tools.some((t) => t.name === "transfer_to_human"));
    assert.ok(!tools.some((t) => t.name === "create_booking")); // no booking by phone
    assert.equal(history.at(-1).text, "How much is a deep clean for three hours?");
    const q = await runTool("get_quote", { service: "Deep Clean", hours: 3 });
    return `That would be ${q.total} pounds.`;
  };
  const { token } = await incomingToken("CA6");
  const s = await openSession(token, "CA6");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA6" }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "How much is a deep clean", last: false }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "for three hours?", last: true }));
  await waitFor(() => s.received.find((m) => m.type === "text"));
  assert.deepEqual(s.received[0], { type: "text", token: "That would be 92.55 pounds.", last: true });

  const call = await waitFor(async () => {
    const c = await AiCall.findOne({ twilioCallSid: "CA6" }).lean();
    return c.transcript.length === 3 ? c : null;
  });
  assert.equal(call.phone, "+447700900123");
  assert.match(call.transcript[0].text, /you're speaking with Brenda/);
  assert.equal(call.transcript[1].role, "customer");
  assert.equal(call.transcript[2].tools[0].detail, "Price check: Deep Clean, 3h → £92.55");

  s.ws.close();
  await waitFor(async () => (await AiCall.findOne({ twilioCallSid: "CA6" })).endReason === "caller hung up");
});

test("transfer: AI hands over → session ends with transfer → /after dials the team", async () => {
  fakeAi = async ({ runTool }) => {
    await runTool("transfer_to_human", { reason: "wants a person" });
    return "Of course, I'm putting you through now.";
  };
  const { token } = await incomingToken("CA7");
  const s = await openSession(token, "CA7");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA7" }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "Can I speak to someone?", last: true }));
  const end = await waitFor(() => s.received.find((m) => m.type === "end"));
  assert.equal(JSON.parse(end.handoffData).reason, "transfer");
  const call = await AiCall.findOne({ twilioCallSid: "CA7" }).lean();
  assert.equal(call.transferred, true);
  assert.equal(call.transcript.at(-1).tools[0].detail, "Caller transferred to the team");

  const after = await (await twilioPost("/api/voice/after", { CallSid: "CA7", HandoffData: end.handoffData, SessionStatus: "ended" })).text();
  assert.match(after, /<Dial>\+447911000111<\/Dial>/);
  s.ws.close();
});

test("AI failure → apology and transfer; a failed session also transfers", async () => {
  fakeAi = async () => {
    throw new Error("provider down");
  };
  const { token } = await incomingToken("CA8");
  const s = await openSession(token, "CA8");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA8" }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "Hello?", last: true }));
  const text = await waitFor(() => s.received.find((m) => m.type === "text"));
  assert.match(text.token, /having a little trouble\. Let me put you through/);
  const end = await waitFor(() => s.received.find((m) => m.type === "end"));
  assert.equal(JSON.parse(end.handoffData).reason, "transfer");
  s.ws.close();

  const after = await (await twilioPost("/api/voice/after", { CallSid: "CA9", SessionStatus: "failed", ErrorCode: "64105" })).text();
  assert.match(after, /<Dial>\+447911000111<\/Dial>/);
});

test("prompts before a valid setup are ignored", async () => {
  let called = false;
  fakeAi = async () => {
    called = true;
    return "x";
  };
  const ws = new WebSocket(base.replace("http", "ws") + RELAY_PATH);
  await new Promise((r) => ws.on("open", r));
  ws.send(JSON.stringify({ type: "prompt", voicePrompt: "hi", last: true }));
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(called, false);
  ws.close();
});
