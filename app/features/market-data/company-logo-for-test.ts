import { crc32, deflateSync } from "node:zlib";
import { companyLogoPixels } from "./company-logo-format.ts";

/** A wide mark, such as a wordmark, and a square mark fill a tile in different ways, as the deployment guide explains. */
export type CompanyLogoShape = "square" | "wide";

/** The pixels of a prepared tile that the prototype leaves on each side of a mark, which the deployment guide asks of the owner and the browser tests check. A wide mark fills the width of the tile, so a wordmark reads at a small size, and a square mark keeps clear of the rounded corners. The server never measures a mark, so only tests use this. */
export const companyLogoPaddingPixels: Readonly<
  Record<CompanyLogoShape, number>
> = { square: 8, wide: 3 };

type ImageDataMode = "single" | "split" | "interrupted";
// A wordmark is far wider than the least ratio of a wide mark, so the generated wide mark is too.
const wideMarkRows = 26;
interface LogoEncodingForTest {
  palettesBefore?: readonly Buffer[];
  palettesAfter?: readonly Buffer[];
  rowFilter?: number;
  dataMode?: ImageDataMode;
}
const privateChunkType = "loGo";

/** Generated geometric ink exercises square symbols and wide marks without carrying a company's trademark. */
export function companyLogoForTest(
  shape: CompanyLogoShape,
  extraBytes = 0,
  encoding: LogoEncodingForTest = {},
): Buffer {
  const size = companyLogoPixels;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const pixels = geometricPixels(shape, encoding.rowFilter ?? 0);
  const chunks = [
    chunk("IHDR", header),
    ...paletteChunks(encoding.palettesBefore),
    ...imageDataChunks(pixels, encoding.dataMode ?? "single"),
    ...paletteChunks(encoding.palettesAfter),
  ];
  if (extraBytes > 0)
    chunks.push(chunk(privateChunkType, Buffer.alloc(extraBytes)));
  chunks.push(chunk("IEND", Buffer.alloc(0)));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ...chunks,
  ]);
}

function geometricPixels(shape: CompanyLogoShape, rowFilter: number): Buffer {
  const size = companyLogoPixels;
  const inset = companyLogoPaddingPixels[shape];
  const verticalInsets: Record<CompanyLogoShape, number> = {
    square: inset,
    wide: (size - wideMarkRows) / 2,
  };
  const verticalInset = verticalInsets[shape];
  const pixels = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row++) {
    pixels[row * (size * 4 + 1)] = rowFilter;
    for (let column = 0; column < size; column++) {
      const ink =
        column >= inset &&
        column < size - inset &&
        row >= verticalInset &&
        row < size - verticalInset;
      const offset = row * (size * 4 + 1) + 1 + column * 4;
      pixels.set(ink ? [0, 80, 180, 255] : [255, 255, 255, 255], offset);
    }
  }
  return pixels;
}

function imageDataChunks(pixels: Buffer, mode: ImageDataMode): Buffer[] {
  const compressed = deflateSync(pixels);
  if (mode === "single") return [chunk("IDAT", compressed)];
  const middle = Math.floor(compressed.length / 2);
  const chunks = [chunk("IDAT", compressed.subarray(0, middle))];
  switch (mode) {
    case "split":
      break;
    case "interrupted":
      chunks.push(chunk(privateChunkType, Buffer.alloc(0)));
      break;
  }
  chunks.push(chunk("IDAT", compressed.subarray(middle)));
  return chunks;
}

function paletteChunks(palettes: readonly Buffer[] | undefined): Buffer[] {
  return (palettes ?? []).map((palette) => chunk("PLTE", palette));
}

function chunk(kind: string, data: Buffer): Buffer {
  const bytes = Buffer.alloc(data.length + 12);
  bytes.writeUInt32BE(data.length);
  bytes.write(kind, 4, "ascii");
  data.copy(bytes, 8);
  bytes.writeUInt32BE(crc32(bytes.subarray(4, -4)), bytes.length - 4);
  return bytes;
}
