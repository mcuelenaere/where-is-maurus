import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
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
