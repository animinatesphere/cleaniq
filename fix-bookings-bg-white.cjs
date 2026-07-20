const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/Bookings.jsx");
let content = fs.readFileSync(file, "utf8");

// Replace all remaining bg-white with bg-white/5 or bg-[#0B2D22] depending on context
const fixes = [
  // Modal/container backgrounds - use dark background
  [
    "bg-white rounded-[28px] overflow-hidden",
    "bg-[#0B2D22] rounded-[28px] overflow-hidden",
  ],
  ["bg-white rounded-2xl p-4", "bg-white/5 rounded-2xl p-4"],
  ["bg-white rounded-2xl border-2", "bg-white/5 rounded-2xl border-2"],
  ["bg-white rounded-2xl border", "bg-white/5 rounded-2xl border"],
  ["bg-white rounded-lg", "bg-white/5 rounded-lg"],
  ["bg-white rounded-xl", "bg-white/5 rounded-xl"],
  ["bg-white border border-white/10", "bg-white/5 border border-white/10"],
  ["bg-white border-2", "bg-white/5 border-2"],
  ["bg-white text-white/70", "bg-white/5 text-white/70"],
  ["bg-white border-white/20", "bg-white/5 border-white/20"],
  ["bg-white hover:shadow-md", "bg-white/5 hover:shadow-md"],
  [
    "p-6 md:p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-white",
    "p-6 md:p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1 bg-[#0B2D22]",
  ],
  ["w-10 h-10 rounded-full bg-white", "w-10 h-10 rounded-full bg-white/10"],
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
