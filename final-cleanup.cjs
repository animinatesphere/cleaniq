const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "src/admin/NewBookingPage.jsx");
let content = fs.readFileSync(file, "utf8");

// Final cleanup
const replacements = [
  ['" bg-white hover:', '" bg-white/5 hover:'],
  ['" bg-white text-', '" bg-white/5 text-'],
  ['" bg-white focus:', '" bg-white/5 focus:'],
  ['" bg-white outline:', '" bg-white/5 outline:'],
  ["border-zinc-900", "border-[#10B981]"],
  ["bg-white/5 focus:bg-white", "bg-white/5 focus:bg-white/10"],
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
console.log(`\n✓ Total final fixes: ${changeCount}`);
