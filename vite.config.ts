import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// base: "./" makes all asset paths relative, so the build works whether it's
// served from a domain root or a project subpath like /ksCOMMANDcenter/ on
// GitHub Pages.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
