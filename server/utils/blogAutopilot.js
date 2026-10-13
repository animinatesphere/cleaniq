// Blog autopilot (admin → Blog → Autopilot): Claude writes and posts a blog post by itself every
// 2, 3, 4 or 7 days at a set UK time, following the team's instructions. The cover photo rotates
// through the photos already on the blog plus any photo links added in the settings.
//
// Settings live in SystemSetting "blogAutopilot". A due post is claimed atomically, so it's
// written once even with a restart. A failed run retries an hour later, at most 3 times.
const SystemSetting = require("../models/SystemSetting");
const BlogPost = require("../models/BlogPost");

const KEY = "blogAutopilot";
const EVERY = [2, 3, 4, 7];
const DEFAULTS = {
  enabled: false,
  everyDays: 7,
  time: "09:00",           // UK time
  instructions: "",
  mode: "publish",          // "publish" straight away, or "draft" for the team to check
  images: [],               // extra cover photo links (https://…)
  nextRunAt: null,
  lastRunAt: null,
  lastResult: "",
  lastPostId: null,
  failures: 0,
};
const MAX_FAILURES = 3;

// Offset (minutes) of UK time from UTC at a given moment.
function londonOffset(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return Math.round((asUtc - date.getTime()) / 60000);
}
// The moment it's HH:MM in the UK on the UK calendar day of `day`.
function ukTimeOn(day, time) {
  const [h, m] = String(time || "09:00").split(":").map(Number);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(day); // YYYY-MM-DD
  const [y, mo, d] = ymd.split("-").map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, m));
  return new Date(guess.getTime() - londonOffset(guess) * 60000);
}
// Next posting time: today at the set time if that's still ahead, otherwise tomorrow.
function firstRunFrom(now, time) {
  const today = ukTimeOn(now, time);
  return today > now ? today : ukTimeOn(new Date(now.getTime() + 24 * 3600 * 1000), time);
}

async function getSettings() {
  const row = await SystemSetting.findOne({ key: KEY }).lean();
  return { ...DEFAULTS, ...(row?.value || {}) };
}

async function saveSettings(input = {}) {
  const cur = await getSettings();
  const next = { ...cur };
  if (input.enabled !== undefined) next.enabled = Boolean(input.enabled);
  if (input.everyDays !== undefined && EVERY.includes(Number(input.everyDays))) next.everyDays = Number(input.everyDays);
  if (input.time !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(String(input.time))) next.time = String(input.time);
  if (input.instructions !== undefined) next.instructions = String(input.instructions).trim().slice(0, 2000);
  if (input.mode !== undefined && ["publish", "draft"].includes(input.mode)) next.mode = input.mode;
  if (input.images !== undefined) {
    const list = Array.isArray(input.images) ? input.images : String(input.images).split(/\s+/);
    next.images = [...new Set(list.map((u) => String(u).trim()).filter((u) => /^https:\/\/\S+$/i.test(u)))].slice(0, 30);
  }
  if (next.enabled && !next.instructions) throw new Error("Write the instructions for Claude before switching autopilot on.");
  // Turning it on, or changing when it posts: the next post is at the next set time.
  const timingChanged = next.enabled && (!cur.enabled || next.time !== cur.time || next.everyDays !== cur.everyDays || !cur.nextRunAt);
  if (timingChanged) next.nextRunAt = firstRunFrom(new Date(), next.time);
  if (!next.enabled) next.nextRunAt = null;
  if (timingChanged) next.failures = 0;
  await SystemSetting.updateOne({ key: KEY }, { $set: { value: next } }, { upsert: true });
  return next;
}

// Cover photo: whichever available photo was used longest ago (never-used first).
async function pickImage(settings) {
  const posts = await BlogPost.find({ image: { $nin: [null, ""] } }).select("image publishAt createdAt").lean();
  const lastUsed = new Map();
  for (const p of posts) {
    const t = new Date(p.publishAt || p.createdAt).getTime();
    if (!lastUsed.has(p.image) || lastUsed.get(p.image) < t) lastUsed.set(p.image, t);
  }
  const pool = [...new Set([...(settings.images || []), ...lastUsed.keys()])];
  if (!pool.length) return null;
  pool.sort((a, b) => (lastUsed.get(a) ?? 0) - (lastUsed.get(b) ?? 0));
  return pool[0];
}

/** Writes one post now. Returns the saved post. */
async function writePost(settings = null) {
  const s = settings || (await getSettings());
  if (!s.instructions) throw new Error("No instructions for Claude yet.");
  const image = await pickImage(s);
  if (!image) throw new Error("No cover photo available — add a photo link in the autopilot settings, or create one post with a photo first.");
  const recent = await BlogPost.find().sort({ createdAt: -1 }).limit(30).select("title").lean();
  const draft = await require("./blogWriter").draftBlogPost({
    topic: `Choose a fresh, useful topic and write the post, following these instructions from the team:\n${s.instructions}`,
    avoidTitles: recent.map((p) => p.title),
  });
  if (!draft.title || !draft.content) throw new Error("Claude returned an empty post.");
  return BlogPost.create({
    title: draft.title,
    description: draft.description || draft.title,
    content: draft.content,
    image,
    author: "Cleaniq Team",
    published: s.mode !== "draft",
    publishAt: new Date(),
    source: "autopilot",
  });
}

async function record(fields) {
  const s = await getSettings();
  await SystemSetting.updateOne({ key: KEY }, { $set: { value: { ...s, ...fields } } }, { upsert: true });
}

/** "Post one now" from admin (doesn't change the schedule). */
async function runNow() {
  const post = await writePost();
  await record({ lastRunAt: new Date(), lastResult: `${post.published ? "Posted" : "Saved as draft"}: ${post.title}`, lastPostId: post._id });
  return post;
}

// Scheduler tick: write the due post, once.
async function processDue(now = new Date()) {
  const s = await getSettings();
  if (!s.enabled || !s.nextRunAt || new Date(s.nextRunAt) > now) return null;
  const due = new Date(s.nextRunAt);
  // Claim it: move nextRunAt on before writing, so a second tick or a restart can't post twice.
  const claimNext = new Date(due.getTime() + s.everyDays * 24 * 3600 * 1000);
  const claimed = await SystemSetting.updateOne(
    { key: KEY, "value.nextRunAt": s.nextRunAt },
    { $set: { "value.nextRunAt": claimNext } },
  );
  if (!claimed.modifiedCount) return null;
  try {
    const post = await writePost(s);
    // Keep the set time even if this ran late (server was down): next = next due slot after now.
    let next = claimNext;
    while (next <= now) next = new Date(next.getTime() + s.everyDays * 24 * 3600 * 1000);
    await record({ nextRunAt: next, lastRunAt: new Date(), lastResult: `${post.published ? "Posted" : "Saved as draft"}: ${post.title}`, lastPostId: post._id, failures: 0 });
    console.log(`[blog autopilot] ${post.published ? "posted" : "drafted"} "${post.title}"`);
    return post;
  } catch (err) {
    const failures = (s.failures || 0) + 1;
    const retry = failures < MAX_FAILURES ? new Date(now.getTime() + 3600 * 1000) : claimNext;
    await record({ nextRunAt: retry, lastRunAt: new Date(), lastResult: `Failed: ${err.message}${failures < MAX_FAILURES ? " (trying again in an hour)" : " (skipped until the next post)"}`, failures: failures < MAX_FAILURES ? failures : 0 });
    console.error("[blog autopilot] failed:", err.message);
    return null;
  }
}

function startBlogAutopilot() {
  setTimeout(() => processDue().catch((e) => console.error("[blog autopilot]", e.message)), 2 * 60 * 1000);
  setInterval(() => processDue().catch((e) => console.error("[blog autopilot]", e.message)), 10 * 60 * 1000);
}

module.exports = { getSettings, saveSettings, runNow, processDue, startBlogAutopilot, firstRunFrom, ukTimeOn, EVERY, DEFAULTS };
