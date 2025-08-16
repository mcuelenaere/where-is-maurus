import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["macros"] } }), lingui(), tailwindcss()],
  root: "src/share",
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    sourcemap: false,
    outDir: "../../dist/share",
  },
});
