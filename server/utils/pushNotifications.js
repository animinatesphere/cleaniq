const axios = require("axios");

// Android plays sound/heads-up only through a notification channel; both apps create a "default"
// channel at max importance with sound (the worker app also has "cleaniq-jobs" for job alerts).
const sendCustomerPush = async (expoPushToken, { title, body, data = {}, channelId = "default" }) => {
  if (!expoPushToken || (!expoPushToken.startsWith("ExponentPushToken") && !expoPushToken.startsWith("ExpoPushToken"))) return;
  try {
    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      { to: expoPushToken, sound: "default", title, body, data, priority: "high", channelId },
      { headers: { "Content-Type": "application/json", "Accept": "application/json" } },
    );
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

// Send to multiple worker push tokens in a single batched request
const sendWorkersPush = async (tokens, { title, body, data = {}, channelId = "cleaniq-jobs" }) => {
  // Accept both ExponentPushToken[...] (legacy) and ExpoPushToken[...] (current) formats
  const valid = (tokens || []).filter(t => t && (t.startsWith("ExponentPushToken") || t.startsWith("ExpoPushToken")));
  if (valid.length === 0) return;
  const messages = valid.map(to => ({
    to, sound: "default", title, body, data, priority: "high", channelId,
  }));
  try {
    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      messages,
      { headers: { "Content-Type": "application/json", "Accept": "application/json" } },
    );
    console.log(`📲 Worker push sent to ${valid.length} device(s): ${title}`);
  } catch (err) {
    console.error("Worker batch push failed:", err.message);
  }
};

module.exports = { sendCustomerPush, sendWorkersPush };
