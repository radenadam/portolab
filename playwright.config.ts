import { defineConfig, devices } from "@playwright/test";
import { baseUrl } from "./e2e/test-server.ts";

const isContinuousIntegration = process.env["CI"] === "true";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isContinuousIntegration,
  retries: 0,
  reporter: isContinuousIntegration ? [["github"], ["list"]] : "list",
  // The global setup starts the server, because the tests need its database in a file, and only a teardown of its own can remove that file after the server stops.
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: baseUrl,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
    },
  ],
});
