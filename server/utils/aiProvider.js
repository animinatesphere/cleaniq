// Sends a conversation to the configured AI provider and returns the reply text.
// Provider is chosen in .env so it can be switched (e.g. Gemini → Claude) without code changes:
//   AI_PROVIDER=gemini
//   GEMINI_API_KEY=...
//   AI_MODEL=gemini-3.8-flash   (optional)
const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const DEFAULT_MODELS = { gemini: "gemini-3.8-flash" };
const TIMEOUT_MS = 20000;

// Our roles → Gemini roles. Gemini needs the first turn to be "user" and works best with
// alternating turns, so consecutive turns from the same side are merged.
function toGeminiContents(history) {
  const contents = [];
  for (const msg of history) {
    const text = (msg.text || "").trim();
    if (!text) continue;
    const role = msg.role === "customer" ? "user" : "model"; // ai + staff replies are "our" side
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
  }
  while (contents.length && contents[0].role !== "user") contents.shift();
  return contents;
}

let geminiClient = null;
function getGemini() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in server/.env");
  if (!geminiClient) {
    const { GoogleGenAI } = require("@google/genai");
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`AI provider timed out after ${ms / 1000}s`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * @param {object} args
 * @param {string} args.system   instructions from aiBrain.getInstructions()
 * @param {{role: "customer"|"ai"|"staff", text: string}[]} args.history  oldest first, ending with the customer's message
 * @param {object} [args.client] injected client for tests
 * @returns {Promise<string|null>} reply text, or null if the provider returned nothing usable
 */
async function generateReply({ system, history, client }) {
  if (PROVIDER !== "gemini") {
    throw new Error(`AI_PROVIDER "${PROVIDER}" is not supported yet (supported: gemini)`);
  }
  const contents = toGeminiContents(history);
  if (!contents.length) return null;

  const started = Date.now();
  const response = await withTimeout(
    (client || getGemini()).models.generateContent({
      model: process.env.AI_MODEL || DEFAULT_MODELS.gemini,
      contents,
      config: { systemInstruction: system, maxOutputTokens: 2048, temperature: 0.4 },
    }),
    TIMEOUT_MS,
  );
  const text = (response.text || "").trim();
  if (!text) {
    const reason = response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason || "unknown";
    console.warn(`[ai] empty reply from ${PROVIDER} (reason: ${reason})`);
    return null;
  }
  console.log(`[ai] ${PROVIDER} replied in ${Date.now() - started}ms`);
  return text;
}

module.exports = { generateReply, toGeminiContents, PROVIDER };
