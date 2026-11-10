import { crc32 } from "node:zlib";

/** Reads the files of a zip archive that stores them without compression, as a reader of Office documents does: from the end record to the central directory, and from each central header to the local header and the bytes of its file. It throws when a header disagrees with the other or with the bytes, because the test then fails. */
export function readZipForTest(archive: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(
    archive.buffer,
    archive.byteOffset,
    archive.byteLength,
  );
  const decoder = new TextDecoder();
  const end = archive.byteLength - 22;
  expectField("end record signature", view.getUint32(end, true), 0x06054b50);
  const count = view.getUint16(end + 10, true);
  expectField("files on this disk", view.getUint16(end + 8, true), count);
  let central = view.getUint32(end + 16, true);
  expectField(
    "end of the central directory",
    central + view.getUint32(end + 12, true),
    end,
  );
  const files = new Map<string, Uint8Array>();
  for (let index = 0; index < count; index += 1) {
    expectField(
      "central header signature",
      view.getUint32(central, true),
      0x02014b50,
    );
    expectField("compression", view.getUint16(central + 10, true), 0);
    const size = view.getUint32(central + 24, true);
    const nameLength = view.getUint16(central + 28, true);
    const local = view.getUint32(central + 42, true);
    const name = decoder.decode(
      archive.subarray(central + 46, central + 46 + nameLength),
    );
    expectField(
      `local header signature of ${name}`,
      view.getUint32(local, true),
      0x04034b50,
    );
    for (const [field, localOffset, centralOffset] of [
      ["checksum", 14, 16],
      ["compressed size", 18, 20],
      ["size", 22, 24],
    ] as const) {
      expectField(
        `${field} of ${name}`,
        view.getUint32(local + localOffset, true),
        view.getUint32(central + centralOffset, true),
      );
    }
    const start = local + 30 + nameLength + view.getUint16(local + 28, true);
    const content = archive.subarray(start, start + size);
    expectField(
      `checksum of the bytes of ${name}`,
      crc32(content),
      view.getUint32(central + 16, true),
    );
    files.set(name, content);
    central += 46 + nameLength;
  }
  return files;
}

function expectField(field: string, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(
      `The ${field} of the archive is ${String(actual)}, but it should be ${String(expected)}.`,
    );
  }
}
