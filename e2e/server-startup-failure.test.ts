import { expect, test } from "@playwright/test";
import { serverStartupFailure } from "./server-startup-failure.ts";

test("distinguishes successful startup, process exit, and a health timeout", () => {
  const healthUrl = "http://localhost:4173/health";
  expect(
    serverStartupFailure({ kind: "answered" }, healthUrl, 60),
  ).toBeUndefined();
  expect(
    serverStartupFailure({ kind: "stopped", reason: "code 1" }, healthUrl, 60),
  ).toBe(
    "The browser test server stopped with code 1 before it answered at http://localhost:4173/health.",
  );
  expect(serverStartupFailure({ kind: "timedOut" }, healthUrl, 60)).toBe(
    "The browser test server did not answer at http://localhost:4173/health within 60 seconds.",
  );
});
