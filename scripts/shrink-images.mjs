// Shrinks big photos in place (same file names, so no code changes): max 1600px wide, JPEGs
// re-encoded at quality 78, PNGs (logos, transparency) recompressed. Skips files already small.
// Run: node scripts/shrink-images.mjs   — safe to run again after adding new photos.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const DIRS = ["src/assets", "public"];
const MIN_BYTES = 250 * 1024;
const MAX_WIDTH = 1600;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});

let before = 0, after = 0;
for (const file of DIRS.flatMap(walk)) {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
  const size = fs.statSync(file).size;
  if (size < MIN_BYTES) continue;
  const img = sharp(file, { failOn: "none" }).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const out = ext === ".png" ? await img.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
    : ext === ".webp" ? await img.webp({ quality: 78 }).toBuffer()
    : await img.jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer();
  if (out.length >= size) continue; // never make a file bigger
  fs.writeFileSync(file, out);
  before += size; after += out.length;
  console.log(`${(size / 1024).toFixed(0).padStart(6)} KB → ${(out.length / 1024).toFixed(0).padStart(5)} KB  ${file}`);
}
console.log(`Total: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`);
