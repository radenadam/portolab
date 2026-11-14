import { defineConfig } from "vitest/config";
import { readCheckSettings } from "./scripts/read-check-settings.ts";

const settings = readCheckSettings();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    ...(settings.maximumWorkers === undefined
      ? {}
      : { maxWorkers: settings.maximumWorkers }),
    include: [
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
      "server/**/*.test.ts",
      "scripts/**/*.test.ts",
      "eslint.config.test.ts",
    ],
    environment: "node",
  },
});
