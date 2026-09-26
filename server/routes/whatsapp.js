// Twilio WhatsApp webhook. Set this in Twilio as "When a message comes in" (HTTP POST):
//   https://<your API domain>/api/whatsapp/twilio
const express = require("express");
const twilio = require("twilio");
const router = express.Router();
const { handleIncoming, getTwilioCredentials } = require("../utils/whatsapp");

// The URL Twilio signed. Behind nginx, req.protocol/host may not match the public URL,
// so PUBLIC_API_URL (e.g. https://api.cleaniqservices.com) is used when set.
function publicUrl(req) {
  const base = process.env.PUBLIC_API_URL
    ? process.env.PUBLIC_API_URL.replace(/\/+$/, "")
    : `${req.protocol}://${req.get("host")}`;
  return base + req.originalUrl;
}

router.post("/twilio", async (req, res) => {
  const signature = req.get("X-Twilio-Signature") || "";
  try {
    const { token } = await getTwilioCredentials();
    if (!token) {
      console.error("[whatsapp] webhook rejected: Twilio auth token not configured");
      return res.status(503).send("Not configured");
    }
    if (!twilio.validateRequest(token, signature, publicUrl(req), req.body || {})) {
      console.warn(`[whatsapp] webhook rejected: bad signature (url used: ${publicUrl(req)})`);
      return res.status(403).send("Invalid signature");
    }
  } catch (err) {
    console.error("[whatsapp] webhook validation error:", err);
    return res.status(500).send("Error");
  }

  // Acknowledge straight away with empty TwiML; the AI reply is sent separately via the API,
  // because the AI can take longer than Twilio's webhook timeout.
  res.type("text/xml").send("<Response></Response>");

  const from = req.body.From;
  handleIncoming(req.body)
    .then((result) => console.log(`[whatsapp] ${from}: ${result.action}`))
    .catch((err) => console.error(`[whatsapp] failed to handle message from ${from}:`, err));
});

module.exports = router;
