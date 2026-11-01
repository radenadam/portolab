import { readdirSync, readFileSync } from "node:fs";

/** A file as a check reads it, with a path that uses forward slashes on every system. */
export interface SourceFile {
  path: string;
  text: string;
}

/** Reads each file in a folder, and in the folders inside it, whose path the check keeps. */
export function readFilesIn(
  folder: string,
  keep: (path: string) => boolean,
): SourceFile[] {
  const files: SourceFile[] = [];
  for (const entry of readdirSync(folder, {
    recursive: true,
    encoding: "utf8",
  })) {
    // Windows separates folders with backslashes, and the checks compare paths with forward slashes.
    const path = `${folder}/${entry.replaceAll("\\", "/")}`;
    if (keep(path)) {
      files.push({ path, text: readFileSync(path, "utf8") });
    }
  }
  return files;
}
