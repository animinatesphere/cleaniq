// Phone channel of the AI receptionist, via Twilio ConversationRelay.
// Twilio turns the caller's speech into text and sends it over a WebSocket; we reply with text,
// which Twilio speaks. One WebSocket connection = one call.
const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const AiSettings = require("../models/AiSettings");
const AiCall = require("../models/AiCall");
const { getInstructions, agentNames } = require("./aiBrain");
const { generateReply } = require("./aiProvider");
const { declarations, makeToolRunner, describeToolResult } = require("./aiTools");
const { toE164UK, findCustomerByPhone } = require("./phone");

const RELAY_PATH = "/api/voice/relay";
const TOKEN_TTL_MS = 2 * 60 * 1000;
const SETUP_TIMEOUT_MS = 15 * 1000;
const MAX_TURNS_PER_CALL = 40; // protects AI credit from very long or looping calls
// Callers can book and get a written quote on the phone too (after the details are read back).
const VOICE_TOOL_NAMES = ["check_postcode", "get_quote", "check_availability", "find_my_bookings", "save_enquiry", "create_booking", "send_quote"];

const TRANSFER_TOOL = {
  name: "transfer_to_human",
  description:
    "Put the caller through to a member of the team. Use when they ask for a person, say it's urgent, want to book or get a written quote on the phone, are upset, or you can't help.",
  parametersJsonSchema: {
    type: "object",
    properties: { reason: { type: "string", description: "Short reason, for the team" } },
  },
};

// ── One-time call secrets ─────────────────────────────────────────────────────────────
// Issued by the signature-checked /incoming webhook and passed back by Twilio in the setup
// message, so only calls that really came through our Twilio number can open a session.
const callTokens = new Map(); // token -> { callSid, expires, agentName }

function issueCallToken(callSid, { agentName = "" } = {}) {
  const now = Date.now();
  for (const [t, v] of callTokens) if (v.expires < now) callTokens.delete(t);
  const token = crypto.randomBytes(24).toString("hex");
  callTokens.set(token, { callSid, expires: now + TOKEN_TTL_MS, agentName });
  return token;
}

// Returns the token's details if it's valid for this call (single use), otherwise null.
function consumeCallToken(token, callSid) {
  const entry = token && callTokens.get(token);
  if (!entry) return null;
  callTokens.delete(token);
  return entry.expires >= Date.now() && entry.callSid === callSid ? entry : null;
}

// Rough time Twilio needs to speak a reply, so a transfer doesn't cut it off mid-sentence.
const speakingTimeMs = (text) => Math.min(10000, 1200 + String(text).length * 65);

function greetingFor(settings, agentName = "") {
  const business = settings.businessName || "Cleaniq Services";
  const name = agentName || agentNames(settings)[0];
  return `Hello, thank you for calling ${business}, you're speaking with ${name}. Calls are monitored to help our team. How can I help you today?`;
}

/**
 * Handle one ConversationRelay WebSocket.
 * deps (for tests): { ai, now, speakDelay }
 */
function handleRelaySession(ws, deps = {}) {
  const ai = deps.ai || generateReply;
  const speakDelay = deps.speakDelay || speakingTimeMs;
  const state = { authorized: false, call: null, history: [], turns: 0, ending: false, partial: "", queue: Promise.resolve() };

  const send = (msg) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };
  const say = (text) => send({ type: "text", token: text, last: true });

  const setupTimer = setTimeout(() => {
    if (!state.authorized) {
      console.warn("[voice] no valid setup message; closing");
      ws.close(1008, "Unauthorized");
    }
  }, SETUP_TIMEOUT_MS);

  const addTurn = async (role, text, tools) => {
    state.history.push({ role: role === "customer" ? "customer" : "ai", text });
    if (!state.call) return;
    await AiCall.updateOne(
      { _id: state.call._id },
      { $push: { transcript: { role, text, at: new Date(), ...(tools?.length ? { tools } : {}) } } },
    );
  };

  const endCall = async ({ transfer, reason }) => {
    if (state.ending) return;
    state.ending = true;
    if (state.call) {
      await AiCall.updateOne({ _id: state.call._id }, { $set: { endReason: reason, ...(transfer ? { transferred: true } : {}) } });
    }
    // Twilio then POSTs to /api/voice/after with this handoffData, which dials the team or hangs up.
    send({ type: "end", handoffData: JSON.stringify({ reason: transfer ? "transfer" : "end", detail: reason }) });
  };

  async function onSetup(msg) {
    const callToken = consumeCallToken(msg.customParameters?.token, msg.callSid);
    if (!callToken) {
      console.warn(`[voice] rejected session for call ${msg.callSid || "?"}: bad or missing call token`);
      ws.close(1008, "Unauthorized");
      return;
    }
    state.authorized = true;
    clearTimeout(setupTimer);
    const phone = toE164UK(msg.from) || String(msg.from || "");
    const customer = await findCustomerByPhone(phone).catch(() => null);
    const settings = await AiSettings.get();
    state.call = await AiCall.findOneAndUpdate(
      { twilioCallSid: msg.callSid },
      {
        $setOnInsert: {
          twilioCallSid: msg.callSid,
          phone,
          customer: customer?._id || null,
          customerName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "",
          agentName: callToken.agentName || agentNames(settings)[0],
          startedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    state.settings = settings;
    await addTurn("ai", greetingFor(settings, state.call.agentName)); // spoken by Twilio from welcomeGreeting
    console.log(`[voice] call ${msg.callSid} from ${phone} connected`);
  }

  async function respond(text) {
    if (state.ending) return;
    // Saved in the background: the AI doesn't need to wait for the database.
    const customerSaved = addTurn("customer", text).catch((err) => console.error("[voice] transcript save failed:", err.message));
    state.turns += 1;
    const settings = state.settings || (await AiSettings.get());
    const canTransfer = Boolean(settings.transferNumber);

    if (state.turns > MAX_TURNS_PER_CALL) {
      const bye = canTransfer
        ? "I'll put you through to a member of the team now."
        : "Thanks for calling. Please message us on WhatsApp on this number and we'll help you there. Goodbye.";
      say(bye);
      await addTurn("ai", bye);
      setTimeout(() => endCall({ transfer: canTransfer, reason: "turn limit reached" }), speakDelay(bye));
      return;
    }

    const toolEvents = [];
    let transferRequested = false;
    const baseRunner = makeToolRunner({
      phone: state.call?.phone || "",
      channel: "voice",
      conversationId: state.call ? String(state.call._id) : null,
      onTool: (e) => toolEvents.push(e),
    });
    const runTool = async (name, args) => {
      if (name === "transfer_to_human") {
        if (!canTransfer) return { error: "No transfer number is set. Offer a call back or WhatsApp instead." };
        transferRequested = true;
        toolEvents.push(describeToolResult(name, args, { ok: true }));
        return { ok: true, instruction: "Tell the caller in one short sentence that you're putting them through now." };
      }
      if (!VOICE_TOOL_NAMES.includes(name)) return { error: `${name} isn't available on phone calls.` };
      return baseRunner(name, args);
    };
    const tools = [...declarations.filter((d) => VOICE_TOOL_NAMES.includes(d.name)), ...(canTransfer ? [TRANSFER_TOOL] : [])];

    // Speak each sentence as soon as the AI has written it, instead of waiting for the whole
    // reply: the caller hears the start of the answer within a second or so.
    let pending = "";
    let spoken = "";
    const flush = (all) => {
      const re = all ? /^[\s\S]+$/ : /^[\s\S]*?[.!?…:](?=\s)\s+/;
      let m;
      while (pending && (m = pending.match(re))) {
        const chunk = m[0];
        pending = pending.slice(chunk.length);
        if (chunk.trim()) {
          send({ type: "text", token: chunk, last: false });
          spoken += chunk;
        }
        if (all) break;
      }
    };
    const onText = (delta) => {
      if (state.ending) return;
      pending += delta;
      flush(false);
    };

    let reply = null;
    try {
      const system = await getInstructions("voice", { customerName: state.call?.customerName || "", agentName: state.call?.agentName || "", canBook: true });
      reply = await ai({ system, history: state.history.slice(-30), tools, runTool, onText });
    } catch (err) {
      console.error(`[voice] AI failed on call ${state.call?.twilioCallSid}:`, err.message);
    }
    await customerSaved;

    if (!reply) {
      reply = canTransfer
        ? "Sorry, I'm having a little trouble. Let me put you through to the team."
        : "Sorry, I'm having a little trouble right now. Please message us on WhatsApp on this number, or try again shortly.";
      transferRequested = canTransfer;
      say(reply);
      await addTurn("ai", reply, toolEvents);
      setTimeout(() => endCall({ transfer: canTransfer, reason: "ai error" }), speakDelay(reply));
      return;
    }

    if (spoken || pending) {
      // Already streamed: send what's left and close the turn.
      flush(true);
      send({ type: "text", token: "", last: true });
      reply = spoken.trim() || reply;
    } else {
      say(reply);
    }
    await addTurn("ai", reply, toolEvents);
    if (transferRequested) setTimeout(() => endCall({ transfer: true, reason: "transferred to the team" }), speakDelay(reply));
  }

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (msg.type === "setup") {
      state.queue = state.queue.then(() => onSetup(msg)).catch((err) => console.error("[voice] setup failed:", err));
      return;
    }
    if (!state.authorized) return;
    if (msg.type === "prompt") {
      state.partial += `${state.partial ? " " : ""}${msg.voicePrompt || ""}`;
      if (msg.last === false) return;
      const text = state.partial.trim();
      state.partial = "";
      if (!text) return;
      // One reply at a time, in order.
      state.queue = state.queue.then(() => respond(text)).catch((err) => console.error("[voice] respond failed:", err));
    } else if (msg.type === "error") {
      console.error(`[voice] Twilio error on call ${state.call?.twilioCallSid}: ${msg.description}`);
    }
  });

  ws.on("close", () => {
    clearTimeout(setupTimer);
    if (!state.call) return;
    const set = { endedAt: new Date() };
    if (!state.ending) set.endReason = "caller hung up";
    AiCall.updateOne({ _id: state.call._id }, { $set: set })
      .then(() => require("./aiFinishedAlerts").sendCallFinishedAlert(state.call._id)) // email the team
      .catch((err) => console.error("[voice] saving call end failed:", err));
  });

  return state;
}

function attachVoiceRelay(server) {
  const wss = new WebSocketServer({ server, path: RELAY_PATH });
  wss.on("connection", (ws) => handleRelaySession(ws));
  console.log(`📞 Voice relay listening on ${RELAY_PATH}`);
  return wss;
}

module.exports = { attachVoiceRelay, handleRelaySession, issueCallToken, consumeCallToken, greetingFor, RELAY_PATH };
