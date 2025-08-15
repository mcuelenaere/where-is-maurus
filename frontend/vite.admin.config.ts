import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
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
