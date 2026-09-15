import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "indexer",
      include: ["tests/**/*.test.ts"],
      exclude: ["tests/app/**"],
      environment: "node",
    },
  },
  {
    test: {
      name: "app",
      include: ["tests/app/**/*.test.ts"],
      environment: "jsdom",
      setupFiles: ["tests/app/setup.ts"],
    },
  },
]);
