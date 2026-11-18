import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { readCompanyLogoFiles } from "./company-logo-files.server.ts";
import { companyLogoForTest } from "./company-logo-for-test.ts";

test("keeps monograms without a configured folder or with missing files", () => {
  expect(readCompanyLogoFiles(undefined).size).toBe(0);
  const folder = mkdtempSync(join(tmpdir(), "portolab-logo-files-"));
  try {
    expect(readCompanyLogoFiles(folder).size).toBe(0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("loads only tracked regular PNG tiles and keeps a stable snapshot after their removal", () => {
  const folder = mkdtempSync(join(tmpdir(), "portolab-logo-files-"));
  try {
    const image = companyLogoForTest("wide");
    writeFileSync(join(folder, "BBCA.png"), image);
    writeFileSync(join(folder, "TLKM.png"), "not an image");
    writeFileSync(join(folder, "OTHER.png"), image);
    writeFileSync(join(folder, "BBRI.svg"), "<svg/>");
    mkdirSync(join(folder, "ASII.png"));
    const files = readCompanyLogoFiles(folder);
    expect([...files.keys()]).toEqual(["BBCA"]);
    rmSync(join(folder, "BBCA.png"));
    expect(files.get("BBCA")).toEqual(image);
    expect(readCompanyLogoFiles(folder).size).toBe(0);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
