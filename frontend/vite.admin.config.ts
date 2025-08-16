import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["macros"] } }), lingui()],
  root: "src/admin",
  server: {
    port: 5174,
    host: true,
  },
  build: {
    sourcemap: false,
    outDir: "../../dist/admin",
  },
});
