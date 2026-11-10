import { devices } from "@playwright/test";
import type { Project } from "@playwright/test";

/** The devices on which every browser test runs: a computer, and a phone with the narrowest screen that Portolab supports. */
export const browserProjects: Project[] = [
  { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  {
    name: "phone",
    use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } },
  },
];
