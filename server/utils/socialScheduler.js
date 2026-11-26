// Publishes social posts when they're due, and runs the social autopilots (Claude writes and posts).
// Checks every minute. A post is "claimed" before publishing so it can't go out twice.
const SocialPost = require("../models/SocialPost");
const SocialAccount = require("../models/SocialAccount");
const SocialAutopilot = require("../models/SocialAutopilot");
const { decrypt, encrypt } = require("./socialCrypto");
const networks = require("./socialNetworks");
const { writePost, unsplashPhoto } = require("./socialWriter");
const { ukTimeOn } = require("./blogAutopilot");

/** The account with a usable token (X tokens are refreshed when they're about to run out). */
async function usableAccount(acc) {
  if (acc.network === "x" && acc.refreshToken && (!acc.expiresAt || acc.expiresAt.getTime() < Date.now() + 5 * 60 * 1000)) {
    const fresh = await networks.refreshX(decrypt(acc.refreshToken));
    await SocialAccount.updateOne({ _id: acc._id }, { token: encrypt(fresh.token), refreshToken: encrypt(fresh.refreshToken), expiresAt: fresh.expiresAt });
    return { ...acc, token: fresh.token };
  }
  if (acc.expiresAt && acc.expiresAt.getTime() < Date.now()) throw new Error("The connection has expired. Reconnect this account on the Accounts page.");
  return { ...acc, token: decrypt(acc.token) };
}

/** Publish one post to its accounts (only the ones not already done). Returns the updated post. */
async function publishPost(postId, { onlyFailed = false } = {}) {
  const post = await SocialPost.findById(postId);
  if (!post) return null;
  const done = new Set(post.results.filter((r) => r.status === "posted").map((r) => String(r.account)));
  const accounts = await SocialAccount.find({ _id: { $in: post.accounts } }).lean();
  const results = onlyFailed ? post.results.filter((r) => r.status === "posted") : [];
  for (const raw of accounts) {
    if (done.has(String(raw._id))) continue;
    const base = { account: raw._id, network: raw.network, name: raw.name, at: new Date() };
    try {
      const acc = await usableAccount(raw);
      const r = await networks.publishTo(acc, post);
      results.push({ ...base, status: "posted", externalId: r.externalId, url: r.url });
      await SocialAccount.updateOne({ _id: raw._id }, { status: "ok", lastError: "" });
    } catch (err) {
      results.push({ ...base, status: "failed", error: err.message.slice(0, 500) });
      await SocialAccount.updateOne({ _id: raw._id }, { status: "error", lastError: err.message.slice(0, 500) });
    }
  }
  const ok = results.filter((r) => r.status === "posted").length;
  post.results = results;
  post.status = !accounts.length ? "failed" : ok === accounts.length ? "posted" : ok ? "partial" : "failed";
  if (ok) post.postedAt = post.postedAt || new Date();
  await post.save();
  return post;
}

/** Publish every post that's due. */
async function publishDue(now = new Date()) {
  const out = [];
  for (;;) {
    const claimed = await SocialPost.findOneAndUpdate({ status: "scheduled", scheduledAt: { $lte: now } }, { status: "posting" }, { new: true, sort: { scheduledAt: 1 } });
    if (!claimed) break;
    out.push(await publishPost(claimed._id));
  }
  return out;
}

// ── autopilot ─────────────────────────────────────────────────────────────────
/** The next posting time after `from`: the chosen weekdays at the chosen UK times. */
function nextRunAfter(ap, from = new Date()) {
  const days = (ap.days || []).map(Number).filter((d) => d >= 0 && d <= 6);
  const times = (ap.times || []).filter((t) => /^\d{2}:\d{2}$/.test(t));
  if (!days.length || !times.length) return null;
  for (let i = 0; i < 8; i++) {
    const day = new Date(from.getTime() + i * 24 * 3600 * 1000);
    const weekday = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(day) + "T12:00:00Z").getUTCDay();
    if (!days.includes(weekday)) continue;
    const slots = times.map((t) => ukTimeOn(day, t)).filter((d) => d > from).sort((a, b) => a - b);
    if (slots.length) return slots[0];
  }
  return null;
}

/** Claude writes a post for this autopilot and it's published straight away. */
async function runAutopilot(ap, { publish = true } = {}) {
  const recent = (await SocialPost.find({ autopilot: ap._id }).sort({ createdAt: -1 }).limit(10).select("text").lean()).map((p) => p.text);
  const draft = await writePost({ instructions: ap.instructions, pictures: ap.pictures, recent });
  let images = draft.photoRef ? [draft.photoRef] : [];
  let credit = "";
  if (!images.length && (ap.pictures === "ours-then-unsplash" || ap.pictures === "unsplash")) {
    const u = await unsplashPhoto(draft.unsplashSearch || "clean home").catch((e) => { console.warn("[social] Unsplash:", e.message); return null; });
    if (u) { images = [u.ref]; credit = u.credit; }
  }
  const accounts = await SocialAccount.find({ _id: { $in: ap.accounts }, active: true }).select("_id network").lean();
  // Instagram can't post without a photo.
  const targets = accounts.filter((a) => a.network !== "instagram" || images.length).map((a) => a._id);
  const post = await SocialPost.create({
    text: draft.text, variants: draft.variants, images, credit, accounts: targets,
    status: publish ? "posting" : "draft", scheduledAt: new Date(), source: "autopilot", autopilot: ap._id, createdBy: `Autopilot: ${ap.name}`,
  });
  return publish ? publishPost(post._id) : post;
}

async function runDueAutopilots(now = new Date()) {
  const due = await SocialAutopilot.find({ enabled: true, nextRunAt: { $lte: now } });
  for (const ap of due) {
    const next = nextRunAfter(ap, now);
    // Claim it first, so a second server process can't run it too.
    const claimed = await SocialAutopilot.findOneAndUpdate({ _id: ap._id, nextRunAt: ap.nextRunAt }, { nextRunAt: next }, { new: true });
    if (!claimed) continue;
    try {
      const post = await runAutopilot(claimed);
      const ok = post.results.filter((r) => r.status === "posted").length;
      await SocialAutopilot.updateOne({ _id: ap._id }, { lastRunAt: new Date(), lastPost: post._id, failures: 0, lastResult: `Posted to ${ok} of ${post.accounts.length} account${post.accounts.length === 1 ? "" : "s"}` });
    } catch (err) {
      const failures = (claimed.failures || 0) + 1;
      // Try again in 30 minutes, up to 3 times, then wait for the next slot.
      const retry = failures < 3 ? new Date(now.getTime() + 30 * 60 * 1000) : next;
      await SocialAutopilot.updateOne({ _id: ap._id }, { nextRunAt: retry, lastRunAt: new Date(), failures: failures < 3 ? failures : 0, lastResult: `Failed: ${err.message}` });
      console.error("[social autopilot]", ap.name, err.message);
    }
  }
}

function startSocialScheduler() {
  const tick = () => Promise.resolve()
    .then(() => publishDue())
    .then(() => runDueAutopilots())
    .catch((e) => console.error("[social scheduler]", e.message));
  setTimeout(tick, 30 * 1000);
  setInterval(tick, 60 * 1000);
}

module.exports = { publishPost, publishDue, runAutopilot, runDueAutopilots, nextRunAfter, startSocialScheduler };
