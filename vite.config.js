import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
