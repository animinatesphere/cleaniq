// Social autopilot writer: Claude writes one post (with wording for each network) from the team's
// instructions and picks a photo — one of our own photos first, a free Unsplash photo if none fits.
//
// Uses ANTHROPIC_API_KEY (model SOCIAL_AI_MODEL, default Claude Opus 5.5) and, for Unsplash,
// UNSPLASH_ACCESS_KEY (free at unsplash.com/developers). Unsplash photos are credited in the post.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const SocialPhoto = require("../models/SocialPhoto");
const { ourPhotos, UPLOAD_DIR, X_LIMIT } = require("./socialNetworks");

const MODEL = () => process.env.SOCIAL_AI_MODEL || "claude-opus-5-5";
const UNSPLASH = () => process.env.UNSPLASH_API_URL || "https://api.unsplash.com";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "facebook", "instagram", "linkedin", "x", "threads", "google", "pinterest", "tiktok", "youtube", "photo", "unsplashSearch"],
  properties: {
    text: { type: "string", description: "The main post text" },
    facebook: { type: "string", description: "Wording for Facebook" },
    instagram: { type: "string", description: "Wording for Instagram, with 5-10 relevant hashtags at the end" },
    linkedin: { type: "string", description: "Wording for LinkedIn: a little more professional" },
    x: { type: "string", description: `Wording for X, at most ${X_LIMIT - 40} characters including hashtags` },
    threads: { type: "string", description: "Wording for Threads: casual and conversational, at most 450 characters, 1-2 hashtags at most" },
    google: { type: "string", description: "Wording for our Google Business Profile: plain, local and useful (mention Manchester), no hashtags, at most 1,200 characters" },
    pinterest: { type: "string", description: "Wording for Pinterest: first line is a short, searchable title (under 100 characters); then a helpful description under 600 characters with a few keywords" },
    tiktok: { type: "string", description: "Wording for a TikTok photo post: short and lively, first line a hook, 3-6 hashtags at the end" },
    youtube: { type: "string", description: "Wording for a YouTube video: first line is the video title (under 90 characters, no hashtags); then a helpful description of 2-4 short paragraphs mentioning Manchester and our website, with 3-5 hashtags at the end" },
    photo: { type: "string", description: 'The id of the best photo from the list, or "none" if none fits the post' },
    unsplashSearch: { type: "string", description: "2-4 word Unsplash search for a photo that fits, used only if none of ours fits" },
  },
};

/** Photos the autopilot can choose from: our job photos and the dashboard's photo library. */
async function libraryPhotos() {
  const uploaded = (await SocialPhoto.find().sort({ createdAt: -1 }).limit(200).lean()).map((p) => ({ ref: p.path, description: p.description || "Photo uploaded by the team" }));
  return [...uploaded, ...ourPhotos()];
}

async function businessFacts() {
  const lines = ["Cleaniq Services is a cleaning company in Manchester and Greater Manchester, UK. Website: https://www.cleaniqservices.com"];
  try {
    const { loadUkServices } = require("./aiTools");
    const services = (await loadUkServices()).filter((s) => s.category === "Base").map((s) => s.name);
    if (services.length) lines.push(`Services we offer: ${[...new Set(services)].join(", ")}.`);
  } catch {}
  lines.push("Cleaners are vetted (interview, background checks, skills assessment). 48-hour re-clean guarantee. Eco-friendly products. Book online at https://www.cleaniqservices.com/booking or get a free quote at https://www.cleaniqservices.com/get-a-quote.");
  return lines.join("\n");
}

/**
 * Write a post.
 * @param {{ instructions: string, pictures: string, recent?: string[], pool?: Array<{ref, kind, description}> }} input
 *   pool: the team's own photos/videos for this autopilot — Claude must pick one of them.
 * @returns {Promise<{ text, variants: {facebook, instagram, linkedin, x}, photoRef: string|null, unsplashSearch: string }>}
 */
async function writePost({ instructions, pictures = "ours-then-unsplash", recent = [], pool = null }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set on the server.");
  const sdk = require("@anthropic-ai/sdk");
  const Anthropic = sdk.default || sdk;
  const client = new Anthropic({ timeout: 120000, maxRetries: 2, ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}) });
  const mine = Array.isArray(pool) && pool.length > 0;
  const photos = mine ? pool : pictures === "ours" || pictures === "ours-then-unsplash" ? await libraryPhotos() : [];

  const system = `You write social media posts for Cleaniq Services, a cleaning company in Manchester, UK.

What you know about the business (use only this; never invent prices, offers, discounts, statistics, awards, reviews or guarantees beyond it):
${await businessFacts()}

Write in friendly, natural British English. Short paragraphs. At most 2 emojis per post. No made-up customer quotes.
Give wording for each network: Facebook (conversational), Instagram (caption, hashtags at the end), LinkedIn (a little more professional), X (short — at most ${X_LIMIT - 40} characters), Threads (casual, short), Google Business Profile (plain and local, no hashtags), Pinterest (searchable title line, then a description), TikTok (a hook, hashtags at the end) and YouTube (a title line, then a description).\nEach network's wording must be genuinely different, written for how people use that network — not the same text copied with small changes.
${mine
    ? "Media: the team chose the photos and videos in the list for these posts. Choose the id of the one that best fits the post (you must choose one), and write the post so it matches what it shows. For a video, write as if introducing the video."
    : `Photos: choose the id of the photo from the list that best fits the post, or "none" if none of them fits.${photos.length ? "" : " (There is no photo list this time: answer \"none\".)"}`}`;

  const user = [
    `Instructions from the team:\n${instructions}`,
    photos.length && `${mine ? "Photos and videos to choose from" : "Photos we have"} (id — what's in it):\n${photos.map((p, i) => `${i} — ${p.kind === "video" ? "[VIDEO] " : ""}${p.description}`).join("\n")}`,
    recent.length && `Recent posts — say something different, don't repeat these:\n${recent.map((t) => `- ${String(t).slice(0, 200)}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");

  const response = await client.messages.create({
    model: MODEL(),
    max_tokens: 4000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write this post. Try rewording the instructions.");
  const raw = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let d;
  try {
    d = JSON.parse(raw);
  } catch {
    throw new Error("Claude's reply couldn't be read. Please try again.");
  }
  // With the team's own media, one is always used (the first if Claude's choice can't be read).
  const pick = (/^\d+$/.test(String(d.photo).trim()) ? photos[Number(d.photo)] : null) || (mine ? photos[0] : null);
  const clean = (s) => String(s || "").trim().slice(0, 3000);
  return {
    text: clean(d.text),
    variants: { facebook: clean(d.facebook), instagram: clean(d.instagram), linkedin: clean(d.linkedin), x: clean(d.x), threads: clean(d.threads), google: clean(d.google), pinterest: clean(d.pinterest), tiktok: clean(d.tiktok), youtube: clean(d.youtube) },
    photoRef: pick ? pick.ref : null,
    pickedKind: pick?.kind || "photo",
    unsplashSearch: String(d.unsplashSearch || "").trim().slice(0, 60),
  };
}

/**
 * Find a free photo on Unsplash, save it to our uploads (so Instagram & co. can fetch it) and
 * return its address and the credit line Unsplash asks for.
 */
async function unsplashPhoto(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) return null;
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
  const res = await fetch(`${UNSPLASH()}/search/photos?${new URLSearchParams({ query, per_page: "10", orientation: "squarish", content_filter: "high" })}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Unsplash search failed (HTTP ${res.status})`);
  const results = (await res.json()).results || [];
  if (!results.length) return null;
  const photo = results[Math.floor(Math.random() * Math.min(results.length, 5))];
  // Unsplash asks apps to report each download.
  fetch(photo.links.download_location, { headers, signal: AbortSignal.timeout(20000) }).catch(() => {});
  const img = await fetch(`${photo.urls.raw}&w=1600&fm=jpg&q=85`, { signal: AbortSignal.timeout(60000) });
  if (!img.ok) throw new Error(`Unsplash photo download failed (HTTP ${img.status})`);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `unsplash-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await img.arrayBuffer()));
  return { ref: `/uploads/social/${name}`, credit: `Photo: ${photo.user?.name || "Unsplash photographer"} on Unsplash` };
}

module.exports = { writePost, unsplashPhoto, libraryPhotos };
