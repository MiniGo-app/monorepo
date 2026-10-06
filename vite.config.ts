import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// A relative base so the build works from any path.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { target: "es2020" },
});
