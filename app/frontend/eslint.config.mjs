import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const arbitraryValue = String.raw`-\[(#|-?\.?[0-9])|\-\[[^\]]*px`;
const arbitraryValueMessage =
  "Use a design token utility (see globals.css mapping) — no arbitrary values.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${arbitraryValue}/]`,
          message: arbitraryValueMessage,
        },
        {
          selector: `TemplateElement[value.raw=/${arbitraryValue}/]`,
          message: arbitraryValueMessage,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/mockServiceWorker.js",
  ]),
]);

export default eslintConfig;
