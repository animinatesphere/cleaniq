const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
const content = fs.readFileSync(file, "utf8");

// Replace various corrupted dash/unicode patterns
let fixed = content
  .replace(/â"€/g, "—") // corrupted em-dash (shows as box-dash)
  .replace(/â€"/g, "—") // corrupted em-dash (alternate)
  .replace(/â€\?/g, "…") // corrupted ellipsis
  .replace(/â€¦/g, "…") // corrupted ellipsis (alternate)
  .replace(/â€™/g, "'") // corrupted apostrophe
  .replace(/â€œ/g, '"') // corrupted left quote
  .replace(/â€Â/g, ""); // other corrupted characters

// Also remove any control characters that might be present
fixed = fixed.replace(/[\x00-\x1F\x7F]/g, "");

fs.writeFileSync(file, fixed, "utf8");
console.log("✓ Fixed all corrupted UTF-8 characters");
console.log("Changes made:");
console.log('  â"€ → —');
console.log('  â€" → —');
console.log("  â€¦ → …");
