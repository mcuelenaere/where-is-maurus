import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["macros"] } }), lingui()],
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
