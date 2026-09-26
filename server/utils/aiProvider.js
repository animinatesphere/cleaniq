// Sends a conversation to the configured AI provider and returns the reply text.
// Provider is chosen in .env so it can be switched (e.g. Gemini → Claude) without code changes:
//   AI_PROVIDER=gemini
//   GEMINI_API_KEY=...
//   AI_MODEL=gemini-3.8-flash            (optional)
//   AI_FALLBACK_MODEL=gemini-3.7-flash,gemini-3.5-flash   (optional; tried in order when the main model is busy)
//   AI_THINKING_LEVEL=LOW                (optional; LOW | MEDIUM | HIGH — lower is faster)
const PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const DEFAULT_MODELS = { gemini: "gemini-3.8-flash" };
const DEFAULT_FALLBACK_MODELS = { gemini: "gemini-3.7-flash,gemini-3.5-flash" };
const TIMEOUT_MS = 30000;
const RETRY_DELAYS_MS = [1500, 4000];

// Overloaded / rate-limited / server errors and timeouts are worth retrying; bad requests are not.
const isRetryable = (err) => err?.timeout || [429, 500, 502, 503, 504].includes(err?.status);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      timer = setTimeout(() => reject(Object.assign(new Error(`AI provider timed out after ${ms / 1000}s`), { timeout: true })), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

const MAX_TOOL_ROUNDS = 5;

// One model call with retries. Tries `models` in order (main model, retries, then fallback).
async function callModel({ client, models, contents, system, tools, retryDelays }) {
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await withTimeout(
        (client || getGemini()).models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: system,
            maxOutputTokens: 2048,
            temperature: 0.4,
            // Receptionist replies are short lookups; low thinking keeps them fast (default is medium).
            thinkingConfig: { thinkingLevel: (process.env.AI_THINKING_LEVEL || "LOW").toUpperCase() },
            ...(tools?.length ? { tools: [{ functionDeclarations: tools }] } : {}),
          },
        }),
        TIMEOUT_MS,
      );
      return { response, model };
    } catch (err) {
      if (!isRetryable(err) || i === models.length - 1) throw err;
      // 429 = this model's quota is used up: retrying it only burns more quota, so move to the next model.
      let next = i + 1;
      if (err.status === 429) while (next < models.length - 1 && models[next] === model) next++;
      if (models[next] === model && err.status === 429) throw err;
      console.warn(`[ai] ${model} failed (${err.status || "timeout"}); retrying${models[next] !== model ? ` with ${models[next]}` : ""}`);
      if (models[next] === model && i < retryDelays.length) await sleep(retryDelays[i]);
      i = next - 1;
    }
  }
  throw new Error("No AI model available");
}

/**
 * @param {object} args
 * @param {string} args.system   instructions from aiBrain.getInstructions()
 * @param {{role: "customer"|"ai"|"staff", text: string}[]} args.history  oldest first, ending with the customer's message
 * @param {object[]} [args.tools]   function declarations the model may call (see aiTools.js)
 * @param {(name: string, args: object) => Promise<object>} [args.runTool]  executes a tool call
 * @param {object} [args.client] injected client for tests
 * @param {number[]} [args.retryDelays] override retry waits (tests)
 * @returns {Promise<string|null>} reply text, or null if the provider returned nothing usable
 * Retries the main model on temporary errors, then tries the fallback model once.
 */
async function generateReply({ system, history, tools, runTool, client, retryDelays = RETRY_DELAYS_MS }) {
  if (PROVIDER !== "gemini") {
    throw new Error(`AI_PROVIDER "${PROVIDER}" is not supported yet (supported: gemini)`);
  }
  const contents = toGeminiContents(history);
  if (!contents.length) return null;

  const primary = process.env.AI_MODEL || DEFAULT_MODELS.gemini;
  const fallbacks = (process.env.AI_FALLBACK_MODEL || DEFAULT_FALLBACK_MODELS.gemini)
    .split(",").map((m) => m.trim()).filter((m) => m && m !== primary);
  let models = [...retryDelays.map(() => primary), primary, ...fallbacks];

  const started = Date.now();
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const { response, model } = await callModel({ client, models, contents, system, tools, retryDelays });
    if (round === 0 && model !== primary) console.warn(`[ai] answered by fallback model ${model}`);
    // Stay on the model that answered: its thought signatures only make sense to itself.
    models = [...retryDelays.map(() => model), model];

    const calls = tools?.length && runTool ? response.functionCalls || [] : [];
    if (!calls.length) {
      const text = (response.text || "").trim();
      if (!text) {
        const reason = response.promptFeedback?.blockReason || response.candidates?.[0]?.finishReason || "unknown";
        console.warn(`[ai] empty reply from ${PROVIDER} (reason: ${reason})`);
        return null;
      }
      console.log(`[ai] ${PROVIDER} replied in ${Date.now() - started}ms${round ? ` after ${round} tool round(s)` : ""}`);
      return text;
    }

    // Send the model's turn back unchanged (it carries Gemini 3 thought signatures), then the results.
    contents.push(response.candidates[0].content);
    const results = await Promise.all(
      calls.map(async (call) => {
        const result = await runTool(call.name, call.args || {});
        console.log(`[ai] tool ${call.name} → ${result?.error ? `error: ${result.error}` : "ok"}`);
        return result;
      }),
    );
    contents.push({
      role: "user",
      parts: calls.map((call, i) => ({
        functionResponse: { ...(call.id ? { id: call.id } : {}), name: call.name, response: results[i] || {} },
      })),
    });
  }
  console.warn(`[ai] gave up after ${MAX_TOOL_ROUNDS} tool rounds`);
  return null;
}

module.exports = { generateReply, toGeminiContents, PROVIDER };
