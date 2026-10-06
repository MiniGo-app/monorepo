import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base, so the built folder works from any path (a static host, GitHub Pages, a subfolder).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020" },
});
