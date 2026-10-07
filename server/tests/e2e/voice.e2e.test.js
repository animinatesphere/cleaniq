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
  assert.match(body, /<Dial timeout="25">\+447911000111<\/Dial><Say language="en-GB">Sorry, the team couldn't get to the phone/);
  await setSettings({ transferNumber: "" });
  body = await (await twilioPost("/api/voice/incoming", callParams("CA2"))).text();
  assert.match(body, /<Say language="en-GB">Sorry, we can't take your call/);
});

test("voice AI on → ConversationRelay in British English with greeting and a one-time token", async () => {
  await setSettings({ voiceEnabled: true, transferNumber: "+447911000111" });
  const { body, token } = await incomingToken("CA3");
  assert.match(body, /<Connect action="http:\/\/127\.0\.0\.1:\d+\/api\/voice\/after">/);
  assert.match(body, /<ConversationRelay url="ws:\/\/127\.0\.0\.1:\d+\/api\/voice\/relay" language="en-GB"/);
  assert.match(body, / ttsProvider="Google" voice="en-GB-Neural2-B"/); // British male voice
  assert.match(body, /welcomeGreeting="Hello, thank you for calling Cleaniq Services, you&apos;re speaking with (John|Mark|James|David)\. Calls are monitored/);
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
  let systemPrompt = "";
  fakeAi = async ({ system, history, tools, runTool }) => {
    systemPrompt = system;
    assert.ok(tools.some((t) => t.name === "get_quote"));
    assert.ok(tools.some((t) => t.name === "transfer_to_human"));
    // Calls book without an email (callers WhatsApp it); no emailed quotes on calls.
    const book = tools.find((t) => t.name === "create_booking");
    assert.ok(book && !book.parametersJsonSchema.properties.email && !book.parametersJsonSchema.required.includes("email"));
    assert.ok(!tools.some((t) => t.name === "send_quote"));
    assert.equal(history.at(-1).text, "How much is a deep clean for three hours?");
    const q = await runTool("get_quote", { service: "Deep Clean", hours: 3 });
    return `That would be ${q.total} pounds.`;
  };
  const { body, token } = await incomingToken("CA6");
  const spoken = body.match(/you&apos;re speaking with (\w+)\./)[1];
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
  // The name Twilio spoke is the one in the transcript, on the call record and in the AI's instructions.
  assert.equal(call.agentName, spoken);
  assert.match(call.transcript[0].text, new RegExp(`you're speaking with ${spoken}\\.`));
  assert.match(systemPrompt, new RegExp(`^You are ${spoken}, the receptionist`));
  assert.equal(call.transcript[1].role, "customer");
  assert.equal(call.transcript[2].tools[0].detail, "Price check: Deep Clean, 3h → £92.55");

  s.ws.close();
  await waitFor(async () => (await AiCall.findOne({ twilioCallSid: "CA6" })).endReason === "caller hung up");
});

test("a call books a one-off clean without an email: scheduled, caller asked to WhatsApp it", async () => {
  const Booking = require("../../models/Booking");
  let result = null;
  let regular = null;
  fakeAi = async ({ runTool }) => {
    regular = await runTool("create_booking", {
      firstName: "Jane", lastName: "Smith", address: "Salford", suppliesProvidedBy: "Customer",
      service: "Deep Clean", hours: 3, date: "tomorrow", time: "10:00", frequency: "Weekly", customerConfirmed: true,
    });
    result = await runTool("create_booking", {
      firstName: "Jane", lastName: "Smith", email: "misheard@example", address: "Salford", suppliesProvidedBy: "Customer",
      service: "Deep Clean", hours: 3, date: "tomorrow", time: "10:00", customerConfirmed: true,
    });
    return "Your clean is scheduled.";
  };
  const { token } = await incomingToken("CA9");
  const s = await openSession(token, "CA9");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA9" }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "Yes that's right", last: true }));
  await waitFor(() => result);

  assert.match(regular.error, /Regular cleans can't be booked on a call/);
  assert.ok(result.bookingRef, JSON.stringify(result));
  assert.match(result.nextStep, /Your clean is scheduled for .*Could you WhatsApp your email address and booking reference to us on oh seven eight four six, seven two six, four two eight, or email them to info at cleaniq services dot com\?/);
  const b = await Booking.findOne({ bookingId: result.bookingRef }).lean();
  assert.equal(b.customer.email, ""); // never a misheard email
  assert.equal(b.status, "Pending");
  assert.equal(b.leadSource, "Phone AI");
  assert.equal(b.meta.emailToCome, "Caller will WhatsApp their email to +44 7846 726428");
  s.ws.close();
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
  assert.match(after, /<Dial timeout="25">\+447911000111<\/Dial><Say language="en-GB">Sorry, the team couldn't get to the phone/);
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
  assert.match(after, /<Dial timeout="25">\+447911000111<\/Dial><Say language="en-GB">Sorry, the team couldn't get to the phone/);
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

test("replies are spoken sentence by sentence while the AI is still writing", async () => {
  let releaseRest;
  const rest = new Promise((r) => (releaseRest = r));
  fakeAi = async ({ onText }) => {
    onText("Sure, a deep clean is thirty pounds ");
    onText("eighty-five an hour. ");
    await rest; // the AI is still "writing" here
    onText("Would you like me to check a time?");
    return "Sure, a deep clean is thirty pounds eighty-five an hour. Would you like me to check a time?";
  };
  await setSettings({ voiceEnabled: true, transferNumber: "" });
  const { token } = await incomingToken("CA-STREAM");
  const s = await openSession(token, "CA-STREAM");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA-STREAM" }));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "How much is a deep clean?", last: true }));

  // The first sentence is sent before the reply has finished.
  const first = await waitFor(() => s.received.find((m) => m.type === "text"));
  assert.deepEqual(first, { type: "text", token: "Sure, a deep clean is thirty pounds eighty-five an hour. ", last: false });
  releaseRest();
  await waitFor(() => s.received.find((m) => m.type === "text" && m.last === true));
  const texts = s.received.filter((m) => m.type === "text");
  assert.equal(texts.map((m) => m.token).join(""), "Sure, a deep clean is thirty pounds eighty-five an hour. Would you like me to check a time?");
  assert.equal(texts.at(-1).last, true);

  const call = await waitFor(async () => {
    const c = await AiCall.findOne({ twilioCallSid: "CA-STREAM" }).lean();
    return c?.transcript?.length >= 3 ? c : null;
  });
  assert.deepEqual(call.transcript.slice(-2).map((t) => [t.role, t.text]), [
    ["customer", "How much is a deep clean?"],
    ["ai", "Sure, a deep clean is thirty pounds eighty-five an hour. Would you like me to check a time?"],
  ]);
  s.ws.close();
});

test("on a call, a 'yes' to the summary makes the AI book it, and a made-up reference is never spoken", async () => {
  await setSettings({ voiceEnabled: true, transferNumber: "" });
  let forced = null;
  let calls = 0;
  fakeAi = async ({ forceTool, onText }) => {
    forced = forceTool;
    calls += 1;
    if (calls === 1) {
      onText?.("Excellent! ");
      onText?.("**Your booking is confirmed.** Reference BK-1234567. ");
      return "Excellent! **Your booking is confirmed.** Reference BK-1234567.";
    }
    return "Sorry, one moment, I still need to finish the booking.";
  };
  const { token } = await incomingToken("CA-GUARD");
  const s = await openSession(token, "CA-GUARD");
  await waitFor(() => AiCall.exists({ twilioCallSid: "CA-GUARD" }));
  // Pretend the AI's last turn was a booking summary.
  await new Promise((r) => setTimeout(r, 50));
  s.ws.send(JSON.stringify({ type: "prompt", voicePrompt: "Yes", last: true }));
  await waitFor(() => s.received.find((m) => m.type === "text" && m.last === true));
  const said = s.received.filter((m) => m.type === "text").map((m) => m.token).join("");
  assert.doesNotMatch(said, /BK-1234567|\*/); // never spoken
  assert.doesNotMatch(said, /booking is confirmed/i);
  assert.match(said, /Excellent!/);
  assert.equal(calls, 2); // asked again after the made-up reference
  s.ws.close();
});
