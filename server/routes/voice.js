// Twilio Voice webhooks for the AI receptionist.
// In Twilio, set the phone number's "A call comes in" webhook (HTTP POST) to:
//   https://<your API domain>/api/voice/incoming
const express = require("express");
const twilio = require("twilio");
const router = express.Router();
const AiSettings = require("../models/AiSettings");
const AiCall = require("../models/AiCall");
const { getTwilioCredentials } = require("../utils/whatsapp");
const { issueCallToken, greetingFor, RELAY_PATH } = require("../utils/voice");
const { pickAgentName } = require("../utils/aiBrain");

const publicBase = (req) =>
  (process.env.PUBLIC_API_URL ? process.env.PUBLIC_API_URL : `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");

const xml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Text-to-speech voice for calls: a British male voice to match the receptionist's names.
function ttsAttributes() {
  const voice = process.env.TWILIO_TTS_VOICE ?? "en-GB-Neural2-B";
  if (!voice) return "";
  return ` ttsProvider="${xml(process.env.TWILIO_TTS_PROVIDER || "Google")}" voice="${xml(voice)}"`;
}

// Speech recognition: words callers often say, so they're heard right (Twilio "hints").
// Optional TWILIO_STT_PROVIDER / TWILIO_SPEECH_MODEL in .env pick a different recogniser.
const SPEECH_HINTS = [
  "Cleaniq", "end of tenancy", "deep clean", "regular clean", "house cleaning", "office cleaning", "Airbnb",
  "after builders", "post construction", "oven cleaning", "carpet cleaning", "fridge", "freezer",
  "one-off", "weekly", "fortnightly", "monthly", "every three months", "bedrooms", "bathrooms",
  "postcode", "dot com", "dot co dot uk", "gmail", "hotmail", "outlook", "yahoo", "icloud",
  "Manchester", "Salford", "Stockport", "Bolton", "Bury", "Rochdale", "Oldham", "Wigan", "Trafford",
  "Tameside", "Ramsbottom", "Didsbury", "Chorlton", "Fallowfield", "Altrincham", "Sale", "Prestwich",
].join(",");
function speechAttributes() {
  const provider = process.env.TWILIO_STT_PROVIDER ? ` transcriptionProvider="${xml(process.env.TWILIO_STT_PROVIDER)}"` : "";
  const model = process.env.TWILIO_SPEECH_MODEL ? ` speechModel="${xml(process.env.TWILIO_SPEECH_MODEL)}"` : "";
  return `${provider}${model} hints="${xml(SPEECH_HINTS)}"`;
}

const twiml = (res, body) => res.type("text/xml").send(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`);

// Rings the team for about 25 seconds; if nobody picks up, the caller is told we'll call back
// (the call is already logged with their number in Admin → AI Receptionist → Calls).
const dialTeam = (number) =>
  `<Dial timeout="25">${xml(number)}</Dial>` +
  '<Say language="en-GB">Sorry, the team couldn\'t get to the phone just now. We have your number and will call you back as soon as possible. Goodbye.</Say><Hangup/>';
const sorryMessage =
  '<Say language="en-GB">Sorry, we can\'t take your call right now. Please message us on WhatsApp on this number, or try again later. Goodbye.</Say><Hangup/>';

// Same check as the WhatsApp webhook: the request really came from our Twilio account.
async function verifyTwilio(req, res) {
  const { token } = await getTwilioCredentials();
  if (!token) {
    console.error("[voice] webhook rejected: Twilio auth token not configured");
    res.status(503).send("Not configured");
    return false;
  }
  const url = publicBase(req) + req.originalUrl;
  if (!twilio.validateRequest(token, req.get("X-Twilio-Signature") || "", url, req.body || {})) {
    console.warn(`[voice] webhook rejected: bad signature (url used: ${url})`);
    res.status(403).send("Invalid signature");
    return false;
  }
  return true;
}

router.post("/incoming", async (req, res) => {
  try {
    if (!(await verifyTwilio(req, res))) return;
    const settings = await AiSettings.get();
    const callSid = req.body.CallSid;
    console.log(`[voice] incoming call ${callSid} from ${req.body.From}`);

    if (!settings.voiceEnabled) {
      return twiml(res, settings.transferNumber ? dialTeam(settings.transferNumber) : sorryMessage);
    }

    const base = publicBase(req);
    const relayUrl = base.replace(/^http/, "ws") + RELAY_PATH;
    const agentName = pickAgentName(settings);
    const token = issueCallToken(callSid, { agentName });
    twiml(
      res,
      `<Connect action="${xml(base + "/api/voice/after")}">` +
        `<ConversationRelay url="${xml(relayUrl)}" language="en-GB"${ttsAttributes()}${speechAttributes()} welcomeGreeting="${xml(greetingFor(settings, agentName))}">` +
        `<Parameter name="token" value="${token}"/>` +
        `</ConversationRelay></Connect>`,
    );
  } catch (err) {
    console.error("[voice] incoming call failed:", err);
    twiml(res, sorryMessage);
  }
});

// Twilio calls this when the AI session ends (we sent "end", or it failed).
router.post("/after", async (req, res) => {
  try {
    if (!(await verifyTwilio(req, res))) return;
    const settings = await AiSettings.get();
    let handoff = {};
    try {
      handoff = JSON.parse(req.body.HandoffData || "{}");
    } catch {
      handoff = {};
    }
    const failed = Boolean(req.body.ErrorCode) || /fail/i.test(req.body.SessionStatus || "");
    if (failed) console.error(`[voice] session for ${req.body.CallSid} failed: ${req.body.ErrorCode} ${req.body.ErrorMessage || ""}`);

    // Transfer when the AI asked for it, or when the AI session broke (a person is better than silence).
    if ((handoff.reason === "transfer" || failed) && settings.transferNumber) {
      if (failed) {
        await AiCall.updateOne({ twilioCallSid: req.body.CallSid }, { $set: { transferred: true, endReason: "ai session failed; transferred" } });
      }
      return twiml(res, dialTeam(settings.transferNumber));
    }
    twiml(res, failed ? sorryMessage : "<Hangup/>");
  } catch (err) {
    console.error("[voice] after-session handling failed:", err);
    twiml(res, "<Hangup/>");
  }
});

module.exports = router;
