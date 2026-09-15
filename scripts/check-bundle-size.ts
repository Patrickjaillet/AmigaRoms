#!/usr/bin/env tsx
import process from "node:process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const MAX_INITIAL_JS_GZIP_BYTES = 100 * 1024;

async function main(): Promise<void> {
  const assetsDir = path.resolve(import.meta.dirname, "../dist/assets");
  const entries = await readdir(assetsDir);
  const jsFiles = entries.filter((name) => name.endsWith(".js"));

  let totalGzipBytes = 0;
  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file);
    const content = await readFile(filePath);
    const gzipBytes = gzipSync(content).length;
    totalGzipBytes += gzipBytes;
    const stats = await stat(filePath);
    console.info(
      `${file}: ${(stats.size / 1024).toFixed(1)} kB raw, ${(gzipBytes / 1024).toFixed(1)} kB gzip`,
    );
  }

  console.info(`Total initial JS (gzip): ${(totalGzipBytes / 1024).toFixed(1)} kB`);

  if (totalGzipBytes > MAX_INITIAL_JS_GZIP_BYTES) {
    console.error(
      `Bundle size budget exceeded: ${(totalGzipBytes / 1024).toFixed(1)} kB > ${(MAX_INITIAL_JS_GZIP_BYTES / 1024).toFixed(1)} kB`,
    );
    process.exitCode = 1;
    return;
  }

  console.info("Bundle size within budget.");
}

main().catch((error: unknown) => {
  console.error("Bundle size check crashed:", error);
  process.exitCode = 1;
});
