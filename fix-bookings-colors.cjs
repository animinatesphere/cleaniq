const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/Bookings.jsx");
let content = fs.readFileSync(file, "utf8");

// Fix light color patterns
const fixes = [
  ["bg-rose-50", "bg-rose-500/10"],
  ["border-rose-300", "border-rose-400/50"],
  ["border-rose-200", "border-rose-400/30"],
  ["border-rose-100", "border-rose-400/20"],
  [
    "bg-gradient-to-br from-indigo-50 to-indigo-100",
    "bg-gradient-to-br from-indigo-950 to-indigo-900",
  ],
  ["border-indigo-200", "border-indigo-500/50"],
  [
    "bg-gradient-to-br from-rose-50 to-rose-100",
    "bg-gradient-to-br from-rose-950 to-rose-900",
  ],
  ["text-rose-600", "text-rose-400"],
  ["text-rose-700", "text-rose-400"],
  ["text-rose-500", "text-rose-400"],
  ["disabled:bg-slate-300", "disabled:bg-white/20"],
  ["bg-blue-600 hover:bg-blue-700", "bg-[#10B981] hover:bg-[#059669]"],
  ["bg-rose-100", "bg-rose-500/10"],
  ["focus:ring-rose-200", "focus:ring-rose-400/30"],
  ["focus:ring-rose-500", "focus:ring-rose-400/30"],
  ["border-l-4 border-rose-500", "border-l-4 border-rose-400"],
  ["bg-rose-400", "text-rose-400"],
];

let changeCount = 0;
fixes.forEach(([old, newVal]) => {
  const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  const matches = content.match(regex);
  if (matches) {
    changeCount += matches.length;
    content = content.replace(regex, newVal);
    console.log(`✓ ${old} (${matches.length})`);
  }
});

fs.writeFileSync(file, content, "utf8");
console.log(`\n✓ Total: ${changeCount}`);
