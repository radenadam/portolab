import { crc32 } from "node:zlib";

/** A file of a zip archive: its path in the archive, which is ASCII, and its bytes. */
export interface ZipEntry {
  path: string;
  content: Uint8Array;
}

// The sizes and the signatures of the records of the zip format, as section 4.3 of the APPNOTE of PKWARE defines them.
const localHeaderSize = 30;
const centralHeaderSize = 46;
const endRecordSize = 22;
const localHeaderSignature = 0x04034b50;
const centralHeaderSignature = 0x02014b50;
const endRecordSignature = 0x06054b50;
// The archive uses no feature of a version after 2.0, which the writers of Office Open XML commonly give.
const formatVersion = 20;
const storedMethod = 0;
// Every file carries 1 January 1980, the earliest date that the format can hold, so the same files always give the same archive.
const earliestDosDate = (1 << 5) | 1;

interface PreparedEntry {
  name: Uint8Array;
  content: Uint8Array;
  checksum: number;
  offset: number;
}

/** Writes files into a zip archive that stores each of them without compression, which Office Open XML allows. The archive needs fewer than 65,536 files and less than 4 GiB, which the 32 bits of the format hold without its extension for larger archives. */
export function writeZip(
  entries: readonly ZipEntry[],
): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const prepared: PreparedEntry[] = [];
  let localSize = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    prepared.push({
      name,
      content: entry.content,
      checksum: crc32(entry.content),
      offset: localSize,
    });
    localSize += localHeaderSize + name.length + entry.content.length;
    centralSize += centralHeaderSize + name.length;
  }
  const archive = new Uint8Array(localSize + centralSize + endRecordSize);
  const view = new DataView(archive.buffer);
  for (const entry of prepared) {
    view.setUint32(entry.offset, localHeaderSignature, true);
    writeEntryFields(view, entry.offset + 4, entry);
    archive.set(entry.name, entry.offset + localHeaderSize);
    archive.set(
      entry.content,
      entry.offset + localHeaderSize + entry.name.length,
    );
  }
  let offset = localSize;
  for (const entry of prepared) {
    view.setUint32(offset, centralHeaderSignature, true);
    view.setUint16(offset + 4, formatVersion, true);
    writeEntryFields(view, offset + 6, entry);
    // The comment, the disk, and the attributes of each file stay zero, which the buffer starts with.
    view.setUint32(offset + 42, entry.offset, true);
    archive.set(entry.name, offset + centralHeaderSize);
    offset += centralHeaderSize + entry.name.length;
  }
  view.setUint32(offset, endRecordSignature, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, localSize, true);
  return archive;
}

/** Writes the fields that the local header and the central header of a file share, from the version that reading it needs to the length of its extra field, which stays zero. */
function writeEntryFields(
  view: DataView,
  start: number,
  entry: PreparedEntry,
): void {
  view.setUint16(start, formatVersion, true);
  view.setUint16(start + 4, storedMethod, true);
  view.setUint16(start + 8, earliestDosDate, true);
  view.setUint32(start + 10, entry.checksum, true);
  view.setUint32(start + 14, entry.content.length, true);
  view.setUint32(start + 18, entry.content.length, true);
  view.setUint16(start + 22, entry.name.length, true);
}
