// @ts-check
import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import svelteParser from "svelte-eslint-parser";
import sveltePlugin from "eslint-plugin-svelte";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const sharedRules = {
  ...tseslint.configs["strict-type-checked"]?.rules,
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/explicit-function-return-type": "warn",
  "no-console": ["warn", { allow: ["error", "warn", "info"] }],
  "no-undef": "off",
};

export default [
  eslint.configs.recommended,
  {
    files: [
      "scripts/**/*.ts",
      "src/types/**/*.ts",
      "src/config/**/*.ts",
      "src/utils/**/*.ts",
      "tests/**/*.ts",
    ],
    ignores: ["tests/app/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./scripts/tsconfig.json", "./tests/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: sharedRules,
  },
  {
    files: ["src/**/*.ts", "tests/app/**/*.ts"],
    ignores: ["src/types/**/*.ts", "src/config/**/*.ts", "src/utils/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./src/tsconfig.json", "./tests/app/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: sharedRules,
  },
  ...sveltePlugin.configs["flat/recommended"],
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
        project: ["./src/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".svelte"],
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["error", "warn", "info"] }],
      "no-undef": "off",
    },
  },
  {
    ignores: ["dist/**", "data/**", "node_modules/**", "public/build/**"],
  },
  prettierConfig,
  ...sveltePlugin.configs["flat/prettier"],
];
