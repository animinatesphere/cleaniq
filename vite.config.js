import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      config: "./tailwind.config.js",
    }),
  ],
  optimizeDeps: {
    include: ["react-helmet-async"],
  },
  server: {
    proxy: {
      "/api": {
        target: "https://api.cleaniqservices.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      // keep default chunking but encourage Vite to pre-bundle heavy deps
    },
  },
});
