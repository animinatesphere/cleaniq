// Admin → Blog → "Draft with AI": Claude writes a draft post (title, summary, article) from a
// topic. It only fills in the editor — staff review, edit and publish or schedule it themselves.
//
// Uses the server's ANTHROPIC_API_KEY. Model: BLOG_AI_MODEL in .env, default Claude Opus 5.5.
const fs = require("fs");
const path = require("path");

const MODEL = () => process.env.BLOG_AI_MODEL || "claude-opus-5-5";
const SITE = "https://www.cleaniqservices.com";

// Pages the article can link to (from the website's sitemap when it's on this server).
const FALLBACK_LINKS = [
  "/get-a-quote", "/booking", "/services", "/about",
  "/service/end-of-tenancy-cleaning-manchester", "/service/deep-cleaning-manchester",
  "/service/regular-house-cleaning-manchester", "/service/airbnb-cleaning-manchester",
  "/service/office-cleaning-manchester", "/service/post-construction-cleaning-manchester",
  "/service/carpet-cleaning-manchester", "/service/oven-cleaning-manchester",
];
function siteLinks() {
  try {
    const xml = fs.readFileSync(path.join(__dirname, "..", "..", "public", "sitemap.xml"), "utf8");
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1].trim()).pathname).filter((p) => p !== "/");
    return paths.length ? paths : FALLBACK_LINKS;
  } catch {
    return FALLBACK_LINKS;
  }
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "content"],
  properties: {
    title: { type: "string", description: "Post title, under 70 characters" },
    description: { type: "string", description: "One or two sentence summary for the blog list and Google, under 160 characters" },
    content: { type: "string", description: "The full article in the formatting described in the instructions" },
  },
};

async function businessFacts() {
  const lines = [];
  try {
    const { loadUkServices } = require("./aiTools");
    const services = (await loadUkServices()).filter((s) => s.category === "Base").map((s) => s.name);
    if (services.length) lines.push(`Services we offer: ${[...new Set(services)].join(", ")}.`);
  } catch {}
  lines.push("Cleaniq Services is a cleaning company in Manchester and Greater Manchester, UK.");
  lines.push("Cleaners are vetted (interview, background checks, skills assessment). 48-hour re-clean guarantee. Eco-friendly products. Customers can book online or get a free quote.");
  return lines.join("\n");
}

/**
 * @param {{ topic: string, keywords?: string, notes?: string }} input
 * @returns {Promise<{ title: string, description: string, content: string }>}
 */
async function draftBlogPost({ topic, keywords = "", notes = "" }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set on the server.");
  const sdk = require("@anthropic-ai/sdk");
  const Anthropic = sdk.default || sdk;
  const client = new Anthropic({ timeout: 120000, maxRetries: 2 });

  const system = `You write blog posts for Cleaniq Services, a cleaning company in Manchester, UK. Readers are homeowners, tenants, landlords, letting agents and Airbnb hosts in Greater Manchester.

What you know about the business (use only this; never invent prices, offers, statistics, awards, reviews or guarantees beyond it):
${await businessFacts()}

Write in clear, friendly British English. Practical and genuinely useful, not salesy. 700–1,100 words.

Formatting for "content" (the website shows exactly this — no other markup):
- Paragraphs separated by a blank line.
- Subheadings on their own line starting with "## ".
- Bullet points on lines starting with "- ".
- Links as [link text](path). Include 2–4 natural links to our own pages, chosen from this list only, using the path exactly as written: ${siteLinks().join(", ")}
- End with a short paragraph inviting readers to get a free quote, linking to /get-a-quote.
- No title at the top of "content" (the title is separate), no bold, no tables, no emojis.`;

  const user = [
    `Topic: ${topic}`,
    keywords && `Keywords to work in naturally: ${keywords}`,
    notes && `Extra notes from the team: ${notes}`,
  ].filter(Boolean).join("\n");

  const response = await client.beta.messages.create({
    model: MODEL(),
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system,
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write this topic. Try rewording it.");
  if (response.stop_reason === "max_tokens") throw new Error("The draft was cut off. Try a narrower topic.");
  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  let draft;
  try {
    draft = JSON.parse(text);
  } catch {
    throw new Error("Claude's reply couldn't be read. Please try again.");
  }
  return {
    title: String(draft.title || "").trim().slice(0, 200),
    description: String(draft.description || "").trim().slice(0, 300),
    content: String(draft.content || "").trim(),
  };
}

module.exports = { draftBlogPost, siteLinks, SITE };
