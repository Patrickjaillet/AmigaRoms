// @ts-check
import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
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
    files: ["scripts/**/*.ts", "src/types/**/*.ts", "src/config/**/*.ts", "src/utils/**/*.ts", "tests/**/*.ts"],
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
    files: ["src/**/*.ts"],
    ignores: ["src/types/**/*.ts", "src/config/**/*.ts", "src/utils/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./src/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: sharedRules,
  },
  {
    ignores: ["dist/**", "data/**", "node_modules/**", "public/build/**"],
  },
  prettierConfig,
];
