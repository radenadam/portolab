import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { expect, test } from "vitest";
import { migrationsFolder } from "./migrations-folder";

test("finds the migrations from the location of the code, so the working directory does not matter", () => {
  expect(isAbsolute(migrationsFolder)).toBe(true);
  expect(existsSync(join(migrationsFolder, "meta", "_journal.json"))).toBe(
    true,
  );
});
