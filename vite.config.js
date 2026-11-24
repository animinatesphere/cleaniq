import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

// "virtual:area-highlights": just each area's highlighted neighbourhoods, read from
// src/content/locations/*.json at build time. The homepage needs only these few words, not every
// location page's full text, so this keeps its download small. Editing the location files (or the
// content editor) still changes them.
const LOCATIONS_DIR = path.resolve("src/content/locations");
const areaHighlights = () => ({
  name: "area-highlights",
  resolveId: (id) => (id === "virtual:area-highlights" ? "\0virtual:area-highlights" : undefined),
  load(id) {
    if (id !== "\0virtual:area-highlights") return undefined;
    const out = {};
    for (const f of fs.readdirSync(LOCATIONS_DIR).filter((n) => n.endsWith(".json"))) {
      this.addWatchFile(path.join(LOCATIONS_DIR, f));
      const data = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, f), "utf8"));
      // Location pages are block pages: the highlights are on the "AreaGuide" block.
      const guide = (data.content || []).find((b) => b.type === "AreaGuide");
      out[f.replace(/\.json$/, "")] = (guide?.props?.highlights || []).map((h) => (typeof h === "string" ? h : h?.text || ""));
    }
    return `export default ${JSON.stringify(out)};`;
  },
});

// Big libraries go in their own files: browsers cache them between visits and deploys, and
// the payment library (Stripe) only downloads on the pages that take payments.
const vendorChunk = (id) => {
  if (!id.includes("node_modules")) return undefined;
  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|react-helmet-async)[\\/]/.test(id)) return "react";
  if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return "motion";
  if (/[\\/]node_modules[\\/]@stripe[\\/]/.test(id)) return "stripe";
  return undefined;
};

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    areaHighlights(),
    react(),
    tailwindcss({
      config: "./tailwind.config.js",
    }),
  ],
  optimizeDeps: {
    include: ["react-helmet-async"],
  },
  build: {
    rollupOptions: {
      // Only for the browser build; the build-time prerender (SSR) build keeps Vite's defaults.
      output: isSsrBuild ? {} : { manualChunks: vendorChunk },
    },
  },
}));
