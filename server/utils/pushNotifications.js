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

module.exports = { sendCustomerPush };
