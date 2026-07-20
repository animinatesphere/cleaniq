const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/Bookings.jsx");
let content = fs.readFileSync(file, "utf8");

const replacements = [
  // bg-white patterns
  ["bg-white text-white/30", "bg-white/5 text-white/30"],
  [
    "bg-white border border-white/10 font-bold text-lg",
    "bg-white/5 border border-white/10 font-bold text-lg",
  ],
  [
    "bg-white border border-white/10 font-bold",
    "bg-white/5 border border-white/10 font-bold",
  ],
  ["bg-white border-2 border-white/10", "bg-white/5 border-2 border-white/10"],
  ["bg-white rounded-[32px]", "bg-[#0B2D22] rounded-[32px]"],
  ["bg-white rounded-[48px]", "bg-[#0B2D22] rounded-[48px]"],
  [
    "bg-white rounded-2xl border border-white/10",
    "bg-white/5 rounded-2xl border border-white/10",
  ],
  [
    "bg-white border border-white/10 text-white",
    "bg-white/5 border border-white/10 text-white",
  ],
  [
    "border-white/10 bg-white text-white/70",
    "border-white/10 bg-white/5 text-white/70",
  ],
  ["bg-white border-4", "bg-[#0B2D22] border-4"],
  [
    "border border-white/10 text-white/60 hover:bg-white",
    "border border-white/10 text-white/60 hover:bg-white/10",
  ],
  ["bg-slate-900", "bg-[#0B2D22]"],
  ["text-slate-700", "text-white/70"],
  [
    "border-white/10 text-white/60 hover:bg-white disabled:",
    "border-white/10 text-white/60 hover:bg-white/10 disabled:",
  ],
];

let changeCount = 0;
replacements.forEach(([old, newVal]) => {
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
