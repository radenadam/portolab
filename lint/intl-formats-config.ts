import type { Linter } from "eslint";
import { intlFormats } from "./intl-formats.ts";

/** The modules of the app and the server format text only through app/intl-formats.ts, while a test or its helper may write an expected text with Intl itself, or give Intl the data of another engine. */
export const intlFormatsConfig: Linter.Config = {
  files: ["app/**/*.{ts,tsx}", "server/**/*.ts"],
  ignores: ["app/intl-formats.ts", "**/*.test.*", "**/*-for-test.*"],
  plugins: { "portolab-intl": { rules: { formats: intlFormats } } },
  rules: { "portolab-intl/formats": "error" },
};
