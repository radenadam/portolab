import { defineConfig } from "@playwright/test";
import { secondMilliseconds } from "./app/time-units.ts";
import { browserProjects } from "./e2e/browser-projects.ts";
import { baseUrl, publicServerResolverRule } from "./e2e/test-server.ts";

const isContinuousIntegration = process.env["CI"] === "true";

// Every test shares one server, and the slowest ones hash passwords and scan each screen in two themes, so their time grows with the tests that run beside them. Alone they take about 13 seconds, and eight at once took 30 seconds on a machine with 16 cores, so the limit leaves twice that, while a test that hangs still fails by name.
const testTimeoutSeconds = 60;

export default defineConfig({
  testDir: "./e2e",
  // The tests of the deployment run against a server that the deployment guide installed, which e2e/deployment/playwright.config.ts names.
  testIgnore: "deployment/**",
  fullyParallel: true,
  forbidOnly: isContinuousIntegration,
  retries: 0,
  timeout: testTimeoutSeconds * secondMilliseconds,
  reporter: isContinuousIntegration ? [["github"], ["list"]] : "list",
  // The global setup starts the server, because the tests need its database in a file, and only a teardown of its own can remove that file after the server stops.
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: baseUrl,
    trace: "retain-on-failure",
    // The address for joining a class depends on whether the lecturer opened Portolab at localhost or at a domain, so a test opens it at both.
    launchOptions: { args: [publicServerResolverRule] },
  },
  projects: browserProjects,
});
