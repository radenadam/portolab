import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { companyLogoPaddingPixels } from "./company-logo-for-test.ts";
import {
  companyLogoPixels,
  maximumCompanyLogoBytes,
} from "./company-logo-format.ts";

test("documents in the deployment guide the size, the byte limit, and the padding of a prepared tile", () => {
  const guide = readFileSync("docs/deploy.md", "utf8").replaceAll(",", "");
  for (const rule of [
    `at ${String(companyLogoPixels)} by ${String(companyLogoPixels)} pixels with at most ${String(maximumCompanyLogoBytes)} bytes`,
    `leave ${String(companyLogoPaddingPixels.wide)} pixels on each horizontal edge`,
    `leave ${String(companyLogoPaddingPixels.square)} pixels around its longest dimension`,
  ]) {
    expect(guide).toContain(rule);
  }
});
