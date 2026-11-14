import type { Linter } from "eslint";

const browserLocation =
  "Use React Router for the address and navigation, so the loaded app survives a page change.";

export const browserNavigation: Linter.Config = {
  files: ["app/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "location", message: browserLocation },
    ],
    "no-restricted-properties": [
      "error",
      // The property restriction also reaches aliases and nested windows, which an object list misses.
      { property: "location", message: browserLocation },
    ],
  },
};
