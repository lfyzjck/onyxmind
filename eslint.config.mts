import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";
import * as path from "path";

const obsidianConfig = Array.from(obsidianmd?.configs?.recommended ?? []);

export default tseslint.config(
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        AsyncGenerator: "readonly",
        AsyncIterable: "readonly",
        AsyncIterableIterator: "readonly",
        AsyncIterator: "readonly",
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js", "manifest.json"],
        },
        tsconfigRootDir: path.resolve(),
        extraFileExtensions: [".json"],
      },
    },
  },
  ...tseslint.configs.recommended,
  ...obsidianConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "obsidianmd/ui/sentence-case": [
        "error",
        { enforceCamelCaseLower: true, brands: ["OpenAI", "Anthropic"] },
      ],
    },
  },
  // Node.js built-ins are available in Electron (desktop-only plugin)
  {
    files: [
      "src/utils/env.ts",
      "src/utils/opencode-server.ts",
      "src/services/opencode-service.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "import/no-nodejs-modules": "off",
    },
  },
  globalIgnores([
    "node_modules",
    "dist",
    "tests",
    "esbuild.config.mjs",
    "eslint.config.*",
    "vitest.config.ts",
    "version-bump.mjs",
    "versions.json",
    "main.js",
  ]),
);
