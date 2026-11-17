import { expect, test } from "vitest";
import { crc32 } from "node:zlib";
import { readFileSync } from "node:fs";
import { companyLogoForTest } from "./company-logo-for-test.ts";
import { parseCompanyLogo } from "./parse-company-logo.server.ts";
import {
  maximumCompanyLogoBytes,
  companyLogoPixels,
} from "./company-logo-format.ts";

test("documents the prepared tile dimensions and byte limit that the parser accepts", () => {
  const guide = readFileSync("docs/deploy.md", "utf8").replaceAll(",", "");
  expect(guide).toContain(
    `at ${String(companyLogoPixels)} by ${String(companyLogoPixels)} pixels with at most ${String(maximumCompanyLogoBytes)} bytes`,
  );
});

test("accepts generated square and wide raster tiles", () => {
  for (const shape of ["square", "wide"] as const) {
    const image = companyLogoForTest(shape);
    expect(parseCompanyLogo(image, "BBCA.png")).toEqual({
      ok: true,
      value: image,
    });
  }
});

test("accepts an optional suggested palette and rejects invalid or repeated palettes", () => {
  for (const size of [3, 768]) {
    const image = companyLogoForTest("square", 0, {
      palettesBefore: [Buffer.alloc(size)],
    });
    expect(parseCompanyLogo(image, "BBCA.png")).toEqual({
      ok: true,
      value: image,
    });
  }
  for (const palettes of [
    [Buffer.alloc(0)],
    [Buffer.alloc(2)],
    [Buffer.alloc(771)],
    [Buffer.alloc(3000)],
    [Buffer.alloc(3), Buffer.alloc(3)],
  ]) {
    expect(
      parseCompanyLogo(
        companyLogoForTest("square", 0, { palettesBefore: palettes }),
        "BBCA.png",
      ).ok,
    ).toBe(false);
  }
  const afterData = companyLogoForTest("square", 0, {
    palettesAfter: [Buffer.alloc(3)],
  });
  expect(parseCompanyLogo(afterData, "BBCA.png").ok).toBe(false);
});

test("accepts consecutive image chunks and rejects an interruption between them", () => {
  const image = companyLogoForTest("square", 0, { dataMode: "split" });
  expect(parseCompanyLogo(image, "BBCA.png")).toEqual({
    ok: true,
    value: image,
  });
  const interrupted = companyLogoForTest("square", 0, {
    dataMode: "interrupted",
  });
  expect(parseCompanyLogo(interrupted, "BBCA.png").ok).toBe(false);
});

test("accepts each PNG row filter and rejects reserved filter values", () => {
  for (const rowFilter of [0, 1, 2, 3, 4]) {
    expect(
      parseCompanyLogo(
        companyLogoForTest("square", 0, { rowFilter }),
        "BBCA.png",
      ).ok,
    ).toBe(true);
  }
  for (const rowFilter of [5, 255]) {
    expect(
      parseCompanyLogo(
        companyLogoForTest("square", 0, { rowFilter }),
        "BBCA.png",
      ).ok,
    ).toBe(false);
  }
});

test("accepts the byte limit and rejects files just beyond it and far beyond it", () => {
  const base = companyLogoForTest("square");
  const extra = maximumCompanyLogoBytes - base.length - 12;
  const atLimit = companyLogoForTest("square", extra);
  expect(atLimit.length).toBe(maximumCompanyLogoBytes);
  expect(parseCompanyLogo(atLimit, "BBCA.png").ok).toBe(true);
  for (const beyond of [
    companyLogoForTest("square", extra + 1),
    Buffer.alloc(maximumCompanyLogoBytes * 100),
  ]) {
    expect(parseCompanyLogo(beyond, "BBCA.png")).toEqual({
      ok: false,
      failure: `BBCA.png must be a complete 96 by 96 PNG with 8-bit RGBA pixels, no interlacing, and at most 100000 bytes, but it has at least ${String(beyond.length)} bytes.`,
    });
  }
});

test("rejects truncated, corrupt, active, and non-image files with their source", () => {
  const valid = companyLogoForTest("square");
  const corrupt = Buffer.from(valid);
  corrupt[corrupt.length - 1] = 0;
  for (const image of [
    Buffer.alloc(0),
    valid.subarray(0, -1),
    corrupt,
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    Buffer.from("not an image"),
  ]) {
    expect(parseCompanyLogo(image, "BBCA.png").ok).toBe(false);
  }
  expect(parseCompanyLogo("not bytes", "BBCA.png")).toEqual({
    ok: false,
    failure:
      'BBCA.png must be a complete 96 by 96 PNG with 8-bit RGBA pixels, no interlacing, and at most 100000 bytes, but it is "not bytes".',
  });
});

test("rejects other dimensions, pixel depths, color modes, and interlacing even with valid header checksums", () => {
  for (const [offset, value] of [
    [19, 95],
    [23, 95],
    [24, 16],
    [25, 2],
    [26, 1],
    [27, 1],
    [28, 1],
  ] as const) {
    const image = Buffer.from(companyLogoForTest("square"));
    image[offset] = value;
    image.writeUInt32BE(crc32(image.subarray(12, 29)), 29);
    expect(parseCompanyLogo(image, "BBCA.png").ok).toBe(false);
  }
});

test("describes a rejected chunk name with quotes and control characters in its full failure", () => {
  for (const [withChecksum, reason] of [
    [false, "an invalid checksum in the PNG chunk"],
    [true, "an unsupported PNG chunk"],
  ] as const) {
    const image = Buffer.from(companyLogoForTest("square"));
    const imageHeaderBytes = 33;
    const kindOffset = imageHeaderBytes + 4;
    const checksumOffset =
      kindOffset + 4 + image.readUInt32BE(imageHeaderBytes);
    const kind = 'I"\nT';
    image.write(kind, kindOffset, "latin1");
    const checksum = crc32(image.subarray(kindOffset, checksumOffset));
    if (withChecksum) image.writeUInt32BE(checksum, checksumOffset);
    expect(image.readUInt32BE(checksumOffset) === checksum).toBe(withChecksum);
    expect(parseCompanyLogo(image, "BBCA.png")).toEqual({
      ok: false,
      failure: `BBCA.png must be a complete 96 by 96 PNG with 8-bit RGBA pixels, no interlacing, and at most 100000 bytes, but its ${String(image.length)} bytes have ${reason} ${JSON.stringify(kind)}.`,
    });
  }
});
