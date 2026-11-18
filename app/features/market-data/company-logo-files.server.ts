import { lstatSync, openSync, readSync, closeSync } from "node:fs";
import type { Stats } from "node:fs";
import { join } from "node:path";
import { createContext } from "react-router";
import { errorMessage } from "../../error-message.ts";
import { writeLog } from "../../write-log.server.ts";
import { trackedStockCodes } from "./tracked-instruments.ts";
import { parseCompanyLogo } from "./parse-company-logo.server.ts";
import { maximumCompanyLogoBytes } from "./company-logo-format.ts";
import { companyLogoFileName } from "./company-logo-paths.ts";

export type CompanyLogoFiles = ReadonlyMap<string, Buffer>;
export const companyLogoFilesContext = createContext<CompanyLogoFiles>(
  new Map(),
);

/** A startup snapshot bounds disk work and keeps the catalogue and the served bytes together until the owner restarts. */
export function readCompanyLogoFiles(
  folder: string | undefined,
): CompanyLogoFiles {
  const images = new Map<string, Buffer>();
  if (folder === undefined) return images;
  try {
    const directory = lstatSync(folder);
    if (!directory.isDirectory()) {
      writeLog(
        "warning",
        `${folder} must be a folder, but it is ${fileKind(directory)}, so companies keep their monograms.`,
      );
      return images;
    }
  } catch (error) {
    writeLog(
      "warning",
      `Portolab could not read the company logo folder ${folder}, so companies keep their monograms. ${errorMessage(error)}`,
    );
    return images;
  }
  for (const code of trackedStockCodes) {
    const path = join(folder, companyLogoFileName(code));
    let descriptor: number | undefined;
    try {
      const file = lstatSync(path);
      if (!file.isFile()) {
        writeLog(
          "warning",
          `${path} must be a regular PNG file, but it is ${fileKind(file)}, so its company keeps the monogram.`,
        );
        continue;
      }
      descriptor = openSync(path, "r");
      const image = parseCompanyLogo(readBoundedFile(descriptor), path);
      if (image.ok) images.set(code, image.value);
      else writeLog("warning", image.failure);
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        writeLog(
          "warning",
          `Portolab could not read ${path}, so its company keeps the monogram. ${errorMessage(error)}`,
        );
    } finally {
      if (descriptor !== undefined) closeSync(descriptor);
    }
  }
  return images;
}

function readBoundedFile(descriptor: number): Buffer {
  // Reading one byte beyond the bound detects oversized files without allocating their size.
  const bytes = Buffer.alloc(maximumCompanyLogoBytes + 1);
  let length = 0;
  while (length < bytes.length) {
    const count = readSync(
      descriptor,
      bytes,
      length,
      bytes.length - length,
      null,
    );
    if (count === 0) break;
    length += count;
  }
  return bytes.subarray(0, length);
}

function fileKind(file: Stats): string {
  if (file.isDirectory()) return "a folder";
  if (file.isSymbolicLink()) return "a symbolic link";
  if (file.isFile()) return "a regular file";
  return "a special file";
}
