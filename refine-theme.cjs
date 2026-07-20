const fs = require("fs");
const path = require("path");

const replacements = [
  // Success screen background - special case
  [
    '<div className="bg-white border border-white/10 rounded-2xl',
    '<div className="bg-[#0B2D22] border border-white/10 rounded-2xl',
  ],
  ["bg-emerald-100", "bg-[#10B981]/10"],
  ["text-emerald-600", "text-[#10B981]"],

  // Additional dark theme colors
  ["text-red-500", "text-rose-400"],
  ["bg-red-", "bg-rose-"],

  // Design tokens object - update entire Z object
  [
    `const Z = {
  bg: "#FAFAFA",
  card: "#FFFFFF",
  border: "#E4E4E7",
  text: "#18181B",
  muted: "#71717A",
  subtle: "#F4F4F5",
  ring: "#A1A1AA",
  primary: "#18181B",
  green: "#059669",
  red: "#DC2626",
  amber: "#D97706",
};`,
    `const Z = {
  bg:      "#03110C",
  card:    "#0B2D22",
  border:  "#10B981",
  text:    "#FFFFFF",
  muted:   "#D1D5DB",
  subtle:  "#1F4E3F",
  ring:    "#10B981",
  primary: "#10B981",
  green:   "#10B981",
  red:     "#F87171",
  amber:   "#FBBF24",
};`,
  ],
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = 0;

  for (const [old, newVal] of replacements) {
    if (content.includes(old)) {
      const count = (
        content.match(
          new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        ) || []
      ).length;
      content = content.split(old).join(newVal);
      changed += count;
    }
  }

  if (changed > 0) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(
      `✓ ${path.basename(filePath)}: ${changed} additional replacements`,
    );
  }
}

const files = ["src/admin/NewBookingPage.jsx"];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    fixFile(filePath);
  }
}

console.log("✓ Additional theme refinements complete");
