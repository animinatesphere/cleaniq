#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const replacements = [
  // Form containers
  [
    "bg-white border border-zinc-200 rounded-xl",
    "bg-[#0B2D22] border border-white/10 rounded-xl",
  ],
  [
    "bg-white border border-zinc-200 rounded-lg",
    "bg-white/5 border border-white/10 rounded-lg",
  ],

  // Text colors
  ["text-zinc-900", "text-white"],
  ["text-zinc-600", "text-white/70"],
  ["text-zinc-700", "text-white/80"],
  ["text-zinc-500", "text-white/50"],
  ["text-zinc-400", "text-white/40"],
  ["text-zinc-300", "text-white/40"],

  // Backgrounds
  ["bg-zinc-50", "bg-white/5"],
  ["bg-zinc-100", "bg-white/10"],
  ["bg-zinc-900", "bg-[#10B981]"],

  // Borders
  ["border-zinc-200", "border-white/10"],
  ["border-zinc-300", "border-white/15"],
  ["border-red-", "border-rose-"],

  // Hover states
  ["hover:bg-zinc-100", "hover:bg-white/10"],
  ["hover:text-zinc-900", "hover:text-white"],
  ["hover:border-zinc-300", "hover:border-white/15"],

  // Focus and inputs
  ["focus:ring-blue-500", "focus:ring-[#10B981]"],
  ["ring-blue-500", "ring-[#10B981]"],
  ["focus:border-blue-400", "focus:border-[#10B981]"],

  // Placeholders
  ["placeholder-zinc-400", "placeholder-white/40"],

  // Shadow and rings
  ["ring-1 ring-zinc-200", "ring-1 ring-white/10"],
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  for (const [old, newVal] of replacements) {
    if (content.includes(old)) {
      content = content.split(old).join(newVal);
      changed = true;
      console.log(`  ✓ ${old} → ${newVal}`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

const files = ["src/admin/NewBookingPage.jsx", "src/admin/Bookings.jsx"];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`\nProcessing ${file}...`);
    fixFile(filePath);
  }
}

console.log("\n✓ All files updated");
