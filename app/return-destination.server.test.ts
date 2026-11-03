import { expect, test } from "vitest";
import { captureStderrForTest } from "./capture-stderr-for-test";
import { returnDestination } from "./return-destination.server";

const request = new Request("http://localhost:3000/sign-in");

test("returns to a path on this site, and to the home page when a form names none", () => {
  expect(returnDestination("/account?tab=password", request)).toBe(
    "/account?tab=password",
  );
  expect(returnDestination(null, request)).toBe("/");
  expect(returnDestination("", request)).toBe("/");
});

test("sends a path to another site to the home page, and logs it as a warning with its reason", () => {
  const writes = captureStderrForTest();
  expect(returnDestination("//example.com", request)).toBe("/");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "")).toMatchObject({
    level: "warning",
    message:
      'returnTo must be a path on this site, such as /prices, but it is "//example.com".',
  });
});
