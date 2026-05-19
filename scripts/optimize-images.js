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

// Additional output formats: WebP and AVIF (keeps backups of originals)
const addWebpAvif = async (srcPath, baseName) => {
  try {
    const webpOut = path.join(publicDir, baseName + ".webp");
    const avifOut = path.join(publicDir, baseName + ".avif");

    await sharp(srcPath)
      .resize(1200, 630, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(webpOut);
    console.log(`Wrote ${path.basename(webpOut)}`);
    await sharp(srcPath)
      .resize(1200, 630, { fit: "cover" })
      .avif({ quality: 70 })
      .toFile(avifOut);
    console.log(`Wrote ${path.basename(avifOut)}`);
  } catch (err) {
    console.error("Failed to write webp/avif for", baseName, err);
  }
};

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
      const tmpOut = path.join(publicDir, t.out + ".tmp");
      if (t.format === "jpeg") {
        await transformer
          .jpeg({ quality: 80, progressive: true })
          .toFile(tmpOut);
      } else if (t.format === "png") {
        await transformer.png({ compressionLevel: 9 }).toFile(tmpOut);
      } else {
        await transformer.toFile(tmpOut);
      }
      fs.renameSync(tmpOut, path.join(publicDir, t.out));
      console.log(`Optimized ${t.src} -> ${t.out}`);
      // also produce webp and avif variants
      await addWebpAvif(srcPath, path.parse(t.out).name);
    } catch (err) {
      console.error(`Failed to process ${t.src}:`, err);
    }
  }
}

process()
  .then(() => console.log("Image optimization complete"))
  .catch((err) => console.error(err));
