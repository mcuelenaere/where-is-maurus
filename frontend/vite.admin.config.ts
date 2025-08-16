import react from "@vitejs/plugin-react";
import { lingui } from "@lingui/vite-plugin";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react({ babel: { plugins: ["macros"] } }),
    lingui(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      useCredentials: true,
      devOptions: { enabled: true },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//, /^\/cdn-cgi\//],
      },
      manifest: {
        name: "Where is Maurus - Admin",
        short_name: "WIM Admin",
        start_url: ".",
        scope: ".",
        display: "standalone",
        theme_color: "#0ea5e9",
        background_color: "#111827",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
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
