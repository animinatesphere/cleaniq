// Per-device push tokens. A user can have several phones, so each Worker/Customer keeps a list:
//   pushTokens: [{ token, platform: "ios"|"android"|"", updatedAt }]
// One entry per token (no duplicates), and a token belongs to one account only: when someone else
// logs in on the same phone, it moves to them. `expoPushToken` (one token) is kept in step for
// older app versions and code that still reads it.
const { Expo } = require("expo-server-sdk");

const MAX_DEVICES = 10;
const cleanPlatform = (p) => (["ios", "android"].includes(String(p).toLowerCase()) ? String(p).toLowerCase() : "");

// Adds or refreshes a token for this user. Returns false if the token isn't an Expo token.
async function addToken(Model, userId, token, platform = "") {
  if (!Expo.isExpoPushToken(token)) return false;
  const Worker = require("../models/Worker");
  const Customer = require("../models/Customer");
  // A phone belongs to whoever is logged in on it now.
  await Promise.all([Worker, Customer].map((M) =>
    M.updateMany({ _id: { $ne: userId }, "pushTokens.token": token }, { $pull: { pushTokens: { token } } })));
  await Promise.all([Worker, Customer].map((M) =>
    M.updateMany({ _id: { $ne: userId }, expoPushToken: token }, { expoPushToken: "" })));

  const user = await Model.findById(userId).select("pushTokens");
  if (!user) return false;
  const rest = (user.pushTokens || []).filter((t) => t.token !== token);
  const list = [...rest, { token, platform: cleanPlatform(platform), updatedAt: new Date() }]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_DEVICES);
  await Model.updateOne({ _id: userId }, { $set: { pushTokens: list, expoPushToken: token } });
  return true;
}

// Removes a token from this user (logout). Any remaining device becomes the "latest".
async function removeTokenFromUser(Model, userId, token) {
  const user = await Model.findById(userId).select("pushTokens expoPushToken");
  if (!user) return;
  const list = (user.pushTokens || []).filter((t) => t.token !== token);
  const latest = list.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
  await Model.updateOne(
    { _id: userId },
    { $set: { pushTokens: list, expoPushToken: user.expoPushToken === token ? latest?.token || "" : user.expoPushToken } },
  );
}

// One-off migration, safe to run any number of times: copies each old single token into the
// list if it isn't there yet. Returns how many accounts were updated.
async function migrateSingleTokens() {
  const Worker = require("../models/Worker");
  const Customer = require("../models/Customer");
  let updated = 0;
  for (const Model of [Worker, Customer]) {
    const users = await Model.find({ expoPushToken: { $nin: ["", null] } }).select("expoPushToken pushTokens").lean();
    for (const u of users) {
      if (!Expo.isExpoPushToken(u.expoPushToken)) continue;
      if ((u.pushTokens || []).some((t) => t.token === u.expoPushToken)) continue;
      const res = await Model.updateOne(
        { _id: u._id, "pushTokens.token": { $ne: u.expoPushToken } },
        { $push: { pushTokens: { token: u.expoPushToken, platform: "", updatedAt: new Date() } } },
      );
      updated += res.modifiedCount || 0;
    }
  }
  return updated;
}

module.exports = { addToken, removeTokenFromUser, migrateSingleTokens, MAX_DEVICES };
