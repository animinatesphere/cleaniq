const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/Bookings.jsx");
let content = fs.readFileSync(file, "utf8");

// Final fixes for remaining patterns
const fixes = [
  [
    "bg-white border-white/10 hover:border-primary/30",
    "bg-white/5 border-white/10 hover:border-primary/30",
  ],
  ["focus:bg-white shadow-sm", "focus:bg-white/10 shadow-sm"],
  [
    "border-rose-400 focus:ring-rose-200 focus:border-rose-500 placeholder:text-rose-300",
    "border-rose-400/50 focus:ring-rose-400/30 focus:border-rose-400 placeholder:text-rose-300",
  ],
];

let changeCount = 0;
fixes.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ Fixed (${matches.length})`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total: ${changeCount}`);
