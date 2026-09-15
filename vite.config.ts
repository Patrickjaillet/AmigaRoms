import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";

const BASE = "/GamesRoms/";

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
  },
  plugins: [svelte(), serveDataDir()],
});
