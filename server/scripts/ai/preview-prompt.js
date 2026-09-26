// Read-only: prints exactly what the AI receptionist will be told, using the live database.
//
//   node scripts/ai/preview-prompt.js            # WhatsApp version
//   node scripts/ai/preview-prompt.js voice      # phone version
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const { getInstructions, CHANNELS } = require("../../utils/aiBrain");

const channel = process.argv[2] || "whatsapp";
if (!CHANNELS.includes(channel)) {
  console.error(`❌ Channel must be one of: ${CHANNELS.join(", ")}`);
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const prompt = await getInstructions(channel);
  console.log(`\n──────── ${channel.toUpperCase()} INSTRUCTIONS (${prompt.length} characters) ────────\n`);
  console.log(prompt);
  console.log("\n────────────────────────────────────────────\n");
  await mongoose.disconnect();
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
