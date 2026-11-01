import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, onTestFinished, test } from "vitest";
import { readFilesIn } from "./read-files-in.ts";

test("reads the kept files of a folder and of the folders inside it, with forward slashes", () => {
  const folder = mkdtempSync(join(tmpdir(), "portolab-read-files-"));
  onTestFinished(() => {
    rmSync(folder, { recursive: true, force: true });
  });
  mkdirSync(join(folder, "nested"));
  writeFileSync(join(folder, "first.ts"), "first");
  writeFileSync(join(folder, "nested", "second.ts"), "second");
  writeFileSync(join(folder, "style.css"), "style");
  const files = readFilesIn(folder, (path) => path.endsWith(".ts"));
  files.sort((left, right) => left.path.localeCompare(right.path));
  expect(files).toEqual([
    { path: `${folder}/first.ts`, text: "first" },
    { path: `${folder}/nested/second.ts`, text: "second" },
  ]);
});
