import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "..", "public");
const targets = [
  { src: "preview.jpg", out: "preview.jpg", format: "jpeg" },
  { src: "og-image.png", out: "og-image.png", format: "png" },
  { src: "seo-banner.jpg", out: "seo-banner.jpg", format: "jpeg" },
  { src: "twitter-banner.jpg", out: "twitter-banner.jpg", format: "jpeg" },
];

async function process() {
  for (const t of targets) {
    const srcPath = path.join(publicDir, t.src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skipping missing file: ${t.src}`);
      continue;
    }

    const backup = srcPath + ".orig";
    if (!fs.existsSync(backup)) {
      fs.copyFileSync(srcPath, backup);
      console.log(`Backed up ${t.src} -> ${path.basename(backup)}`);
    }

    const transformer = sharp(srcPath)
      .resize(1200, 630, { fit: "cover" })
      .withMetadata();

    try {
      if (t.format === "jpeg") {
        await transformer
          .jpeg({ quality: 80, progressive: true })
          .toFile(path.join(publicDir, t.out));
      } else if (t.format === "png") {
        await transformer
          .png({ compressionLevel: 9 })
          .toFile(path.join(publicDir, t.out));
      } else {
        await transformer.toFile(path.join(publicDir, t.out));
      }
      console.log(`Optimized ${t.src} -> ${t.out}`);
    } catch (err) {
      console.error(`Failed to process ${t.src}:`, err);
    }
  }
}

process()
  .then(() => console.log("Image optimization complete"))
  .catch((err) => console.error(err));
