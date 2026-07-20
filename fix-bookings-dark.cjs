const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/Bookings.jsx");
let content = fs.readFileSync(file, "utf8");

const replacements = [
  // Main containers
  [
    "bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-10 border border-slate-200",
    "bg-[#0B2D22] rounded-[28px] sm:rounded-[40px] p-4 sm:p-10 border border-white/10",
  ],
  [
    "bg-white rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-slate-100 shadow-xl shadow-slate-200/50",
    "bg-[#0B2D22] rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-white/10 shadow-xl shadow-black/50",
  ],

  // Text colors
  ["text-slate-900", "text-white"],
  ["text-slate-600", "text-white/70"],
  ["text-slate-500", "text-white/60"],
  ["text-slate-400", "text-white/40"],
  ["text-slate-300", "text-white/30"],
  ["text-slate-200", "text-white/20"],

  // Backgrounds
  ["bg-slate-100", "bg-white/10"],
  ["bg-slate-50", "bg-white/5"],
  ["bg-slate-200", "bg-white/15"],

  // Borders
  ["border-slate-200", "border-white/10"],
  ["border-slate-100", "border-white/10"],
  ["border-slate-300", "border-white/20"],

  // Specific patterns
  ["bg-emerald-50/60", "bg-[#10B981]/10"],
  ["border-emerald-200", "border-[#10B981]/30"],
  ["bg-emerald-100", "bg-[#10B981]/20"],
  ["bg-emerald-400", "bg-[#10B981]"],
  ["text-emerald", "text-[#10B981]"],
  ["bg-white text-slate-300", "bg-white/5 text-white/40"],
  [
    "text-slate-300 border border-slate-100",
    "text-white/40 border border-white/10",
  ],
  [
    "hover:bg-primary/10 hover:text-primary",
    "hover:bg-[#10B981]/10 hover:text-[#10B981]",
  ],
  ["hover:bg-slate-100", "hover:bg-white/10"],
  ["hover:text-slate-600", "hover:text-white/70"],
];

let changeCount = 0;
replacements.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ ${old.substring(0, 50)} (${matches.length})`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total Bookings.jsx changes: ${changeCount}`);
