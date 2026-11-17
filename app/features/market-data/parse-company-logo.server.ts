import { crc32, inflateSync } from "node:zlib";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";

import {
  maximumCompanyLogoBytes,
  companyLogoPixels,
} from "./company-logo-format.ts";
const channels = 4;
const rowBytes = companyLogoPixels * channels + 1;
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const headerLength = 33;
const paletteEntryBytes = 3;
const maximumPaletteEntries = 256;

interface PngChunk {
  kind: string;
  data: Buffer;
  end: number;
}

interface PngChunkState {
  compressed: Buffer[];
  endedData: boolean;
  hasPalette: boolean;
}

/** The restricted raster format needs no image library and cannot introduce active SVG content. PNG chunk checks follow https://www.w3.org/TR/png/. */
export function parseCompanyLogo(
  value: unknown,
  source: string,
): Result<Buffer, string> {
  const expectation = `${source} must be a complete ${String(companyLogoPixels)} by ${String(companyLogoPixels)} PNG with 8-bit RGBA pixels, no interlacing, and at most ${String(maximumCompanyLogoBytes)} bytes`;
  if (!Buffer.isBuffer(value))
    return fail(`${expectation}, but it is ${describeValue(value)}.`);
  if (value.length > maximumCompanyLogoBytes)
    return fail(
      `${expectation}, but it has at least ${String(value.length)} bytes.`,
    );
  if (validHeader(value)) {
    const compressed = compressedChunks(value);
    if (!compressed.ok)
      return fail(
        `${expectation}, but its ${String(value.length)} bytes have ${compressed.failure}.`,
      );
    if (validScanlines(compressed.value)) return succeed(value);
  }
  return fail(
    `${expectation}, but its ${String(value.length)} bytes do not have that format.`,
  );
}

function validHeader(bytes: Buffer): boolean {
  return (
    bytes.length >= headerLength &&
    bytes.subarray(0, signature.length).equals(signature) &&
    bytes.readUInt32BE(8) === 13 &&
    bytes.toString("latin1", 12, 16) === "IHDR" &&
    bytes.readUInt32BE(16) === companyLogoPixels &&
    bytes.readUInt32BE(20) === companyLogoPixels &&
    bytes.subarray(24, 29).equals(Buffer.from([8, 6, 0, 0, 0])) &&
    crc32(bytes.subarray(12, 29)) === bytes.readUInt32BE(29)
  );
}

function compressedChunks(bytes: Buffer): Result<Buffer[], string> {
  const state: PngChunkState = {
    compressed: [],
    endedData: false,
    hasPalette: false,
  };
  let offset = headerLength;
  while (offset + 12 <= bytes.length) {
    const chunk = readPngChunk(bytes, offset);
    if (!chunk.ok) return chunk;
    if (chunk.value.kind === "IEND")
      return chunk.value.data.length === 0 &&
        chunk.value.end === bytes.length &&
        state.compressed.length > 0
        ? succeed(state.compressed)
        : fail("an invalid PNG image end");
    const accepted = acceptPngChunk(state, chunk.value);
    if (!accepted.ok) return accepted;
    offset = chunk.value.end;
  }
  return fail("no PNG image end");
}

function readPngChunk(bytes: Buffer, offset: number): Result<PngChunk, string> {
  const length = bytes.readUInt32BE(offset);
  const end = offset + 12 + length;
  if (end > bytes.length) return fail("an incomplete PNG chunk");
  const kind = bytes.toString("latin1", offset + 4, offset + 8);
  if (
    crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4)
  )
    return fail(`an invalid checksum in the PNG chunk "${kind}"`);
  return succeed({ kind, data: bytes.subarray(offset + 8, end - 4), end });
}

function acceptPngChunk(
  state: PngChunkState,
  chunk: PngChunk,
): Result<void, string> {
  if (chunk.kind === "IDAT") {
    if (state.endedData) return fail("nonconsecutive PNG image chunks");
    state.compressed.push(chunk.data);
    return succeed(undefined);
  }
  if (chunk.kind === "PLTE") {
    if (
      state.hasPalette ||
      state.compressed.length > 0 ||
      !validPalette(chunk.data)
    )
      return fail("an invalid or repeated PNG suggested palette");
    state.hasPalette = true;
    return succeed(undefined);
  }
  if (!validAncillaryChunk(chunk.kind))
    return fail(`an unsupported PNG chunk "${chunk.kind}"`);
  state.endedData = state.compressed.length > 0;
  return succeed(undefined);
}

function validPalette(data: Buffer): boolean {
  return (
    data.length >= paletteEntryBytes &&
    data.length <= paletteEntryBytes * maximumPaletteEntries &&
    data.length % paletteEntryBytes === 0
  );
}

function validAncillaryChunk(kind: string): boolean {
  return /^[a-z][A-Za-z][A-Z][A-Za-z]$/.test(kind) && kind !== "acTL";
}

function validScanlines(compressed: Buffer[]): boolean {
  try {
    const pixels = inflateSync(Buffer.concat(compressed), {
      maxOutputLength: companyLogoPixels * rowBytes,
    });
    if (pixels.length !== companyLogoPixels * rowBytes) return false;
    for (let row = 0; row < companyLogoPixels; row++) {
      if (pixels.readUInt8(row * rowBytes) > 4) return false;
    }
    return true;
  } catch {
    return false;
  }
}
