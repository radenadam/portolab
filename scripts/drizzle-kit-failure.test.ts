import { expect, test } from "vitest";
import { drizzleKitFailure } from "./drizzle-kit-failure.ts";

test("accepts a run that exits with 0 and writes nothing to stderr", () => {
  expect(drizzleKitFailure({ status: 0, stderr: "" })).toBeUndefined();
});

test("rejects a run that exits with 0 but writes an error to stderr, as drizzle-kit does after a question that it cannot ask", () => {
  expect(
    drizzleKitFailure({
      status: 0,
      stderr: "Error: Interactive prompts require a TTY terminal.\n",
    }),
  ).toBe(
    "drizzle-kit could not compare the schema with the migrations, and it exited with code 0. It reported: Error: Interactive prompts require a TTY terminal.",
  );
});

test("rejects a run that exits with another code, or that a signal ends", () => {
  expect(drizzleKitFailure({ status: 1, stderr: "" })).toBe(
    "drizzle-kit could not compare the schema with the migrations, and it exited with code 1. It reported: nothing on stderr",
  );
  expect(drizzleKitFailure({ status: null, stderr: "Killed\n" })).toBe(
    "drizzle-kit could not compare the schema with the migrations, and a signal ended it. It reported: Killed",
  );
});
