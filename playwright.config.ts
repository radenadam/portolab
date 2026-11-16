import { defineConfig } from "@playwright/test";
import { secondMilliseconds } from "./app/time-units.ts";
import { browserProjects } from "./e2e/browser-projects.ts";
import {
  baseUrl,
  maximumWorkers,
  publicServerResolverRule,
} from "./e2e/test-server.ts";

const isContinuousIntegration = process.env["CI"] === "true";

// The suite shares one server, so concurrent password hashes and accessibility scans need room within this deadline. Issue #184 records the stock case that exhausted it and its independent flows, because enlarging the deadline would also postpone a real failure.
const testTimeoutSeconds = 60;

export default defineConfig({
  testDir: "./e2e",
  // The tests of the deployment run against a server that the deployment guide installed, which e2e/deployment/playwright.config.ts names.
  testIgnore: "deployment/**",
  fullyParallel: true,
  // Case workers share CPU with the server and Chromium. Decision 0051 records why their deadline margins need a smaller pool in CI. A slot supplies a smaller pool because concurrent checks also compete for CPUs.
  workers: maximumWorkers ?? "50%",
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
