import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set VITE_BASE env var to override the base path at build time.
// For GitHub Pages: vite build --base=/send-file/
// (use the `build:gh-pages` npm script which passes the flag automatically)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "docs",
  },
});
