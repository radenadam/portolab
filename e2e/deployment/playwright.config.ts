import { defineConfig } from "@playwright/test";
import { testDomain } from "../../scripts/deployment-guide.ts";
import { browserProjects } from "../browser-projects.ts";

// The workflow of the deployment runs these tests after it followed the guide on a fresh machine, against the server that the guide installed.
export default defineConfig({
  testDir: ".",
  outputDir: "../../test-results",
  forbidOnly: true,
  retries: 0,
  // The guide's sample lifecycle shares one service, so device projects must finish its removal before the next starts it.
  workers: 1,
  reporter: [["github"], ["list"]],
  use: {
    baseURL: `https://${testDomain}`,
    trace: "retain-on-failure",
  },
  projects: browserProjects,
});
