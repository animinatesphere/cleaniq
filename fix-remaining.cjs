const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let content = fs.readFileSync(file, "utf8");

const replacements = [
  ["text-red-500", "text-rose-400"],
  ["text-red-700", "text-rose-400"],
  ["bg-emerald-600", "bg-[#10B981]"],
  ["hover:bg-emerald-700", "hover:bg-[#059669]"],
  ["bg-emerald-50", "bg-[#10B981]/10"],
  ["text-emerald-600", "text-[#10B981]"],
  ["text-emerald-700", "text-[#10B981]"],
  ["bg-emerald-100", "bg-[#10B981]/20"],
  ["border-emerald-200", "border-[#10B981]/30"],
  ["border-emerald-600", "border-[#10B981]"],

  // Remaining light theme
  ['" bg-white hover:', '" bg-white/5 hover:'],
  ["bg-white focus:", "bg-white/5 focus:"],
  ["text-zinc-800", "text-white"],
  ["focus:ring-zinc-900", "focus:ring-[#10B981]"],
  ["focus:border-zinc-900", "focus:border-[#10B981]/50"],
  ["text-zinc-800", "text-white"],
  ["bg-red-50", "bg-rose-500/10"],
];

let changeCount = 0;
replacements.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ ${old} → ${newVal} (${matches.length})`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total remaining fixes: ${changeCount}`);
