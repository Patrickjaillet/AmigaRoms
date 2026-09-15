import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";

const BASE = "/AmigaRoms/";

function serveDataDir(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, "data");
  const prefix = `${BASE}data/`;
  return {
    name: "serve-data-dir",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(prefix)) {
          next();
          return;
        }
        const filePath = path.join(dataDir, req.url.slice(prefix.length));
        if (!filePath.startsWith(dataDir) || !existsSync(filePath)) {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: BASE,
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["zod", "minisearch", "idb", "@tanstack/svelte-virtual"],
        },
      },
    },
  },
  plugins: [
    svelte(),
    serveDataDir(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "AmigaRoms",
        short_name: "AmigaRoms",
        description:
          "Static Commodore Amiga ROM catalog & search engine indexing Archive.org collections.",
        theme_color: "#2563eb",
        background_color: "#f7f8fa",
        display: "standalone",
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "amigaroms-data",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    ...(process.env["ANALYZE_BUNDLE"]
      ? [
          visualizer({
            filename: path.resolve(import.meta.dirname, "bundle-analysis.html"),
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
});
