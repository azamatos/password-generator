import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".astro/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  // Node scripts: the size budgets and the test server.
  { files: ["**/*.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly", URL: "readonly" } } },
);
