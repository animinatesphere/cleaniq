const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let content = fs.readFileSync(file, "utf8");

// Batch replacements for light theme colors
const replacements = [
  // Cards/containers
  ["bg-white border border-zinc-200", "bg-[#0B2D22] border border-white/10"],
  ["bg-white border border-zinc-100", "bg-[#0B2D22] border border-white/10"],
  ["bg-zinc-50", "bg-white/5"],
  ["bg-red-50/50", "bg-rose-500/10"],

  // Text colors
  ["text-zinc-900", "text-white"],
  ["text-zinc-700", "text-white/70"],
  ["text-zinc-600", "text-white/60"],
  ["text-zinc-500", "text-white/50"],
  ["text-zinc-400", "text-white/40"],
  ["text-zinc-300", "text-white/30"],

  // Borders
  ["border-zinc-200", "border-white/10"],
  ["border-zinc-100", "border-white/10"],
  ["border-zinc-300", "border-white/20"],
  ["border-red-200", "border-rose-400/30"],

  // Hover states
  ["hover:border-zinc-300", "hover:border-white/20"],
  ["hover:border-zinc-400", "hover:border-white/20"],
  ["hover:bg-zinc-50", "hover:bg-white/10"],
  ["hover:bg-zinc-100", "hover:bg-white/10"],
  ["hover:text-zinc-900", "hover:text-white"],

  // Focus states
  ["focus:ring-zinc-900/10", "focus:ring-[#10B981]/30"],
  ["focus:border-zinc-400", "focus:border-[#10B981]/50"],

  // Specific patterns
  ["border-zinc-900 bg-zinc-900", "border-[#10B981] bg-[#10B981]"],
  ["bg-zinc-900 text-white", "bg-[#10B981] text-white"],
  ["bg-zinc-900", "bg-[#10B981]"],
  ["hover:bg-zinc-700", "hover:bg-[#059669]"],

  // Accents and dashed borders
  ["border-dashed border-zinc-200", "border-dashed border-white/10"],
  ["text-blue-600", "text-[#10B981]"],
  ["border-red-200 bg-red-50", "border-rose-400/30 bg-rose-500/10"],
];

let changeCount = 0;
replacements.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ ${old} → ${newVal} (${matches.length} times)`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total changes: ${changeCount}`);
