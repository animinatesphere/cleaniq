const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let content = fs.readFileSync(file, "utf8");

// Fix specific bg-white occurrences
const fixes = [
  // Template strings with conditional styles
  [
    "border-white/10 bg-white hover:border-white/20 hover:bg-white/5",
    "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
  ],
  // Standalone bg-white in templates
  ['" bg-white text-white', '" bg-white/5 text-white'],
  ['" bg-white outline:', '" bg-white/5 outline:'],
  // In p-3 container
  [
    "rounded-xl p-4 space-y-4 bg-white",
    "rounded-xl p-4 space-y-4 bg-[#0B2D22]",
  ],
  // In input styles
  ["focus:bg-white outline:", "focus:bg-white/10 outline:"],
  // Notes textarea
  ["rounded-lg bg-white text-white", "rounded-lg bg-white/5 text-white"],
];

let changeCount = 0;
fixes.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ Fixed (${matches.length}x)`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total: ${changeCount}`);
