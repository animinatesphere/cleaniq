const axios = require("axios");

const sendCustomerPush = async (expoPushToken, { title, body, data = {} }) => {
  if (!expoPushToken) return;
  try {
    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      { to: expoPushToken, sound: "default", title, body, data, priority: "high" },
      { headers: { "Content-Type": "application/json", "Accept": "application/json" } },
    );
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }
};

// Send to multiple worker push tokens in a single batched request
const sendWorkersPush = async (tokens, { title, body, data = {} }) => {
  const valid = (tokens || []).filter(t => t && t.startsWith("ExponentPushToken"));
  if (valid.length === 0) return;
  const messages = valid.map(to => ({
    to, sound: "default", title, body, data, priority: "high",
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
