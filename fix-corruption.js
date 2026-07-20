const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let content = fs.readFileSync(file, "utf8");

// Replace corrupted em-dash patterns
content = content.replace(/â€"/g, "—");
content = content.replace(/â€\?/g, "…");

fs.writeFileSync(file, content, "utf8");
console.log("✓ Fixed all corrupted characters");
