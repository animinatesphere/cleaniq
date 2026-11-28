// Sorts a cold email reply into: interested, question, not_interested, out_of_office, unsubscribe,
// wrong_person or other. Uses Claude when ANTHROPIC_API_KEY is set (model COLD_AI_MODEL, default
// Claude Haiku 5.5); otherwise simple keyword rules.
const CATEGORIES = ["interested", "question", "not_interested", "out_of_office", "unsubscribe", "wrong_person", "other"];

function byKeywords(text) {
  const t = String(text || "").toLowerCase();
  if (/\b(out of (the )?office|on (annual )?leave|on holiday|away until|back on|limited access to email|automatic reply)\b/.test(t)) return "out_of_office";
  if (/\b(unsubscribe|remove me|take me off|stop (emailing|contacting)|do not (email|contact)|don't (email|contact))\b/.test(t)) return "unsubscribe";
  if (/\b(wrong person|no longer (works|with)|left the company|not the right person|not responsible for)\b/.test(t)) return "wrong_person";
  if (/\b(not interested|no thanks|no thank you|we('re| are) (all )?(set|covered|happy with)|already have (a|our) clean)/.test(t)) return "not_interested";
  if (/\b(interested|sounds good|let'?s (talk|chat|book)|send (me|us) (a )?(quote|price|more)|call me|give me a call|book|available (on|next)|yes please)\b/.test(t)) return "interested";
  if (/\?/.test(t)) return "question";
  return "other";
}

async function classifyReply({ subject = "", body = "" }) {
  const text = `${subject}\n\n${body}`.slice(0, 4000);
  if (!process.env.ANTHROPIC_API_KEY) return byKeywords(text);
  try {
    const sdk = require("@anthropic-ai/sdk");
    const Anthropic = sdk.default || sdk;
    const client = new Anthropic({ timeout: 30000, maxRetries: 1, ...(process.env.ANTHROPIC_BASE_URL ? { baseURL: process.env.ANTHROPIC_BASE_URL } : {}) });
    const res = await client.messages.create({
      model: process.env.COLD_AI_MODEL || "claude-haiku-5-5",
      max_tokens: 100,
      output_config: { format: { type: "json_schema", schema: { type: "object", additionalProperties: false, required: ["category"], properties: { category: { type: "string", enum: CATEGORIES } } } } },
      system: "You sort replies to a cleaning company's sales emails (Cleaniq Services, Manchester). Categories: interested (wants a quote, call, price or to book), question (asks something before deciding), not_interested (declines), out_of_office (automatic away/holiday reply), unsubscribe (asks not to be emailed), wrong_person (not the right contact / left the company), other.",
      messages: [{ role: "user", content: text }],
    });
    const raw = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const cat = JSON.parse(raw).category;
    return CATEGORIES.includes(cat) ? cat : byKeywords(text);
  } catch (err) {
    console.warn("[cold email] reply sorting fell back to keywords:", err.message);
    return byKeywords(text);
  }
}

module.exports = { classifyReply, byKeywords, CATEGORIES };
