import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["react-helmet-async"],
  },
  build: {
    rollupOptions: {
      // keep default chunking but encourage Vite to pre-bundle heavy deps
    },
  },
});
