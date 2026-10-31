import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: [
      "app/**/*.test.ts",
      "server/**/*.test.ts",
      "scripts/**/*.test.ts",
      "eslint.config.test.ts",
    ],
    environment: "node",
  },
});
