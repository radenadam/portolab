import type { Linter } from "eslint";
import { testLanguage } from "./test-language.ts";

/** Production code can choose its language, while tests keep their expectations in locale tables. */
export const testLanguageConfig: Linter.Config[] = [
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    plugins: { "portolab-tests": { rules: { language: testLanguage } } },
    rules: { "portolab-tests/language": "error" },
  },
  {
    // Issue #182 fixes every older instance outside the Beranda change before removing this exemption.
    files: [
      "app/change-text.test.tsx",
      "app/features/accounts/profile-menu.test.tsx",
      "app/features/market-data/stock-range.test.tsx",
      "app/features/trading/order-actions.server.test.ts",
      "app/features/trading/stock-position.test.tsx",
      "e2e/stock.test.ts",
    ],
    rules: { "portolab-tests/language": "off" },
  },
];
