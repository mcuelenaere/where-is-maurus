import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react({ babel: { plugins: ["macros"] } }), lingui(), tailwindcss()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  root: "src/apps/admin",
  server: {
    port: 5174,
    host: true,
    open: true,
  },
  build: {
    sourcemap: false,
    outDir: path.resolve(__dirname, "dist/admin"),
  },
});
