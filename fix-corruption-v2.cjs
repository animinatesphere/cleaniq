const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let buffer = fs.readFileSync(file);
let content = buffer.toString("utf8");

console.log("File size:", buffer.length);
console.log("Sample:", content.substring(2280, 2320));

// Try different replacement patterns
content = content.replace(/â€"/g, "—");
content = content.replace(/â€"/g, "—");
content = content.replace(/â€¦/g, "…");
content = content.replace(/â€\?/g, "…");

// Also try looking for the raw bytes
const corrupted = Buffer.from([0xc3, 0xa2, 0xc2, 0x80]);
if (buffer.includes(corrupted)) {
  console.log("Found corrupted bytes");
  content = content.replace(new RegExp(corrupted.toString("utf8"), "g"), "—");
}

fs.writeFileSync(file, content, "utf8");
console.log("✓ Fixed all corrupted characters");
