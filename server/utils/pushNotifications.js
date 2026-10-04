// Push notifications through the Expo Push Service (both apps are Expo), using the official
// expo-server-sdk. Every message has a title and body so the phone shows it even when the app
// is closed. Android plays sound/heads-up only through a notification channel; both apps create
// a "default" channel at max importance (the worker app also has "cleaniq-jobs" for job alerts).
//
// Errors are logged with a "[push]" prefix so they show in `pm2 logs`:
//   - tickets (Expo's immediate reply): e.g. InvalidCredentials = the APNs (iPhone) or FCM
//     (Android) key isn't set up in EAS for that app; DeviceNotRegistered = the app was removed
//   - receipts (checked ~15 minutes later): whether Apple/Google actually accepted it
// Tokens reported as DeviceNotRegistered are removed from the database.
const { Expo } = require("expo-server-sdk");

let expo = new Expo();
const setExpoForTests = (client) => { expo = client; };

const RECEIPT_DELAY_MS = 15 * 60 * 1000;

// Remove a dead token from whichever user has it (workers and customers).
async function removeToken(token, reason) {
  try {
    const Worker = require("../models/Worker");
    const Customer = require("../models/Customer");
    const pull = { $pull: { pushTokens: { token } } };
    const [w, c] = await Promise.all([
      Worker.updateMany({ $or: [{ "pushTokens.token": token }, { expoPushToken: token }] }, pull),
      Customer.updateMany({ $or: [{ "pushTokens.token": token }, { expoPushToken: token }] }, pull),
    ]);
    await Promise.all([
      Worker.updateMany({ expoPushToken: token }, { expoPushToken: "" }),
      Customer.updateMany({ expoPushToken: token }, { expoPushToken: "" }),
    ]);
    const n = (w.modifiedCount || 0) + (c.modifiedCount || 0);
    console.warn(`[push] removed token ${short(token)} (${reason}) from ${n} account(s)`);
  } catch (err) {
    console.error("[push] couldn't remove dead token:", err.message);
  }
}

const short = (t) => String(t).replace(/^(Expo(nent)?PushToken\[)(.{6}).*(\])$/, "$1$3…$4");

function logProblem(stage, token, details = {}, message = "") {
  const error = details.error || "Unknown";
  const hint = {
    InvalidCredentials: "the push key for this app isn't set up in EAS (iPhone: APNs key; Android: FCM V1 key). Run `eas credentials`.",
    DeviceNotRegistered: "the app was uninstalled or notifications were reset on this phone.",
    MessageTooBig: "the message is over 4KB.",
    MessageRateExceeded: "too many messages to this phone too quickly.",
    MismatchSenderId: "the FCM key in EAS belongs to a different Firebase project than google-services.json.",
  }[error] || "";
  console.error(`[push] ${stage} error for ${short(token)}: ${error}${message ? ` — ${message}` : ""}${hint ? ` (${hint})` : ""}`);
}

// Check receipts later; log problems and remove dead tokens.
function checkReceiptsLater(idToToken) {
  const ids = Object.keys(idToToken);
  if (!ids.length) return;
  const t = setTimeout(async () => {
    for (const chunk of expo.chunkPushNotificationReceiptIds(ids)) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        for (const [id, r] of Object.entries(receipts)) {
          if (r.status !== "error") continue;
          const token = idToToken[id];
          logProblem("receipt", token, r.details, r.message);
          if (r.details?.error === "DeviceNotRegistered") await removeToken(token, "receipt: DeviceNotRegistered");
        }
      } catch (err) {
        console.error("[push] couldn't fetch receipts:", err.message);
      }
    }
  }, RECEIPT_DELAY_MS);
  t.unref?.();
}

/**
 * Send one notification to several Expo push tokens.
 * @returns {Promise<{sent:number, failed:number}>}
 */
async function sendToTokens(tokens, { title, body, data = {}, channelId = "default" }) {
  const unique = [...new Set((tokens || []).filter(Boolean))];
  const valid = unique.filter((t) => Expo.isExpoPushToken(t));
  unique.filter((t) => !Expo.isExpoPushToken(t)).forEach((t) => console.warn(`[push] skipped invalid token ${String(t).slice(0, 25)}`));
  if (!valid.length) return { sent: 0, failed: 0 };

  const messages = valid.map((to) => ({ to, sound: "default", title, body, data, priority: "high", channelId }));
  const idToToken = {};
  let sent = 0;
  let failed = 0;
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        const token = chunk[i].to;
        if (ticket.status === "ok") {
          sent++;
          if (ticket.id) idToToken[ticket.id] = token;
        } else {
          failed++;
          logProblem("ticket", token, ticket.details, ticket.message);
          if (ticket.details?.error === "DeviceNotRegistered") await removeToken(token, "ticket: DeviceNotRegistered");
        }
      }
    } catch (err) {
      failed += chunk.length;
      console.error(`[push] sending to Expo failed: ${err.message}`);
    }
  }
  console.log(`[push] "${title}" → ${sent} sent, ${failed} failed`);
  checkReceiptsLater(idToToken);
  return { sent, failed };
}

// Every token a user has: the per-device list plus the single field older app versions set.
function tokensOf(user) {
  if (!user) return [];
  return [...(user.pushTokens || []).map((t) => t.token), user.expoPushToken].filter(Boolean);
}

/**
 * Send to all of one user's devices.
 * @param {"worker"|"customer"} kind
 */
async function sendPushToUser(kind, userId, title, body, data = {}, { channelId } = {}) {
  const Model = kind === "worker" ? require("../models/Worker") : require("../models/Customer");
  const user = await Model.findById(userId).select("pushTokens expoPushToken").lean().catch(() => null);
  return sendToTokens(tokensOf(user), { title, body, data, channelId: channelId || (kind === "worker" ? "cleaniq-general" : "default") });
}

// Push to the customer who owns a booking (customers are matched by email, like everywhere else).
// data.bookingMongoId lets the app open that booking when the notification is tapped.
async function pushToBookingCustomer(booking, title, body, data = {}) {
  try {
    const email = String(booking?.customer?.email || "").trim();
    if (!email) return { sent: 0, failed: 0 };
    const Customer = require("../models/Customer");
    const re = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const customer = await Customer.findOne({ email: re }).select("_id").lean();
    if (!customer) return { sent: 0, failed: 0 };
    return await sendPushToUser("customer", customer._id, title, body, {
      bookingId: booking.bookingId,
      bookingMongoId: booking._id ? String(booking._id) : undefined,
      ...data,
    });
  } catch (err) {
    console.error("[push] customer push failed:", err.message);
    return { sent: 0, failed: 0 };
  }
}

// Older helpers, kept so existing callers don't change.
const sendCustomerPush = (tokenOrTokens, { title, body, data = {}, channelId = "default" }) =>
  sendToTokens([].concat(tokenOrTokens), { title, body, data, channelId });
const sendWorkersPush = (tokens, { title, body, data = {}, channelId = "cleaniq-jobs" }) =>
  sendToTokens(tokens, { title, body, data, channelId });

module.exports = { sendToTokens, sendPushToUser, pushToBookingCustomer, sendCustomerPush, sendWorkersPush, tokensOf, removeToken, setExpoForTests };
