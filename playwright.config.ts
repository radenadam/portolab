import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const isContinuousIntegration = process.env["CI"] === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isContinuousIntegration,
  retries: 0,
  reporter: isContinuousIntegration ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${String(port)}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: "node server/main.ts",
    url: `http://localhost:${String(port)}/health`,
    env: {
      PORT: String(port),
      // A database in memory starts empty for each run, so tests never see data from an earlier run, and it leaves no file behind.
      DATABASE_PATH: ":memory:",
      PRICE_SOURCE: "fixture",
    },
    reuseExistingServer: false,
  },
});
