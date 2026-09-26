// Chat with the AI receptionist in your terminal, using the live knowledge base and prices.
// Nothing is saved and no customer is contacted.
//
//   node scripts/ai/chat-test.js            # as a WhatsApp customer
//   node scripts/ai/chat-test.js voice      # as a phone caller (short spoken-style replies)
//
// ⚠️ On a free AI tier, the provider may use what you type to improve its products:
//    type made-up test messages only, never real customer details.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const readline = require("readline");
const mongoose = require("mongoose");
const { getInstructions, CHANNELS } = require("../../utils/aiBrain");
const { generateReply, PROVIDER } = require("../../utils/aiProvider");

const channel = process.argv[2] || "whatsapp";
if (!CHANNELS.includes(channel)) {
  console.error(`❌ Channel must be one of: ${CHANNELS.join(", ")}`);
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\n🤖 AI receptionist test — ${channel} — provider: ${PROVIDER} ${process.env.AI_MODEL || ""}`);
  console.log("Type as a customer. Commands: /reset (new conversation), /quit\n");

  const history = [];
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = () => rl.question("You: ", async (line) => {
    const text = line.trim();
    if (text === "/quit") { rl.close(); await mongoose.disconnect(); return; }
    if (text === "/reset") { history.length = 0; console.log("(new conversation)\n"); return ask(); }
    if (!text) return ask();

    history.push({ role: "customer", text });
    try {
      // Instructions are rebuilt every turn, like the real channels, so dashboard edits apply live.
      const system = await getInstructions(channel);
      const reply = await generateReply({ system, history: history.slice(-20) });
      const shown = reply || "(no reply — the real system would send a hand-off message here)";
      if (reply) history.push({ role: "ai", text: reply });
      console.log(`\nAI: ${shown}\n`);
    } catch (err) {
      history.pop();
      console.error(`\n❌ ${err.message}\n`);
    }
    ask();
  });
  ask();
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
