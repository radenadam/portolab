import { expect, test } from "vitest";
import { readZipForTest } from "./read-zip-for-test.server";
import { writeZip } from "./write-zip.server";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

test("writes each file in its order under its path, with the checksum and the size that a reader checks", () => {
  const archive = writeZip([
    { path: "[Content_Types].xml", content: encoder.encode("<Types/>") },
    { path: "xl/workbook.xml", content: encoder.encode("<workbook/>") },
    { path: "empty.txt", content: new Uint8Array() },
  ]);
  const files = readZipForTest(archive);
  expect(
    [...files].map(([path, content]) => [path, decoder.decode(content)]),
  ).toEqual([
    ["[Content_Types].xml", "<Types/>"],
    ["xl/workbook.xml", "<workbook/>"],
    ["empty.txt", ""],
  ]);
});

// The bytes come from the APPNOTE of PKWARE: a local header of 30 bytes, the name, and the content, then a central header of 46 bytes with the name, then the end record of 22 bytes. 0x3610a686 is the CRC-32 of "hello", as zlib.crc32 of Python gives it.
test("writes the headers and the end record of the zip format, with the earliest date that the format holds", () => {
  const archive = writeZip([
    { path: "a.txt", content: encoder.encode("hello") },
  ]);
  const view = new DataView(archive.buffer);
  expect(archive.length).toBe(30 + 5 + 5 + 46 + 5 + 22);
  expect(view.getUint32(0, true)).toBe(0x04034b50);
  expect(view.getUint16(4, true)).toBe(20);
  expect(view.getUint16(6, true)).toBe(0);
  expect(view.getUint16(8, true)).toBe(0);
  expect(view.getUint16(10, true)).toBe(0);
  expect(view.getUint16(12, true)).toBe(0x21);
  expect(view.getUint32(14, true)).toBe(0x3610a686);
  expect(view.getUint32(18, true)).toBe(5);
  expect(view.getUint32(22, true)).toBe(5);
  expect(view.getUint16(26, true)).toBe(5);
  const central = 40;
  expect(view.getUint32(central, true)).toBe(0x02014b50);
  expect(view.getUint16(central + 4, true)).toBe(20);
  expect(view.getUint32(central + 16, true)).toBe(0x3610a686);
  expect(view.getUint32(central + 42, true)).toBe(0);
  const end = central + 46 + 5;
  expect(view.getUint32(end, true)).toBe(0x06054b50);
  expect(view.getUint16(end + 8, true)).toBe(1);
  expect(view.getUint16(end + 10, true)).toBe(1);
  expect(view.getUint32(end + 12, true)).toBe(51);
  expect(view.getUint32(end + 16, true)).toBe(central);
});

test("writes the same archive for the same files", () => {
  const entries = [{ path: "a.txt", content: encoder.encode("hello") }];
  expect(writeZip(entries)).toEqual(writeZip(entries));
});
