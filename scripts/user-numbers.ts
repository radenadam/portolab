import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";

/** The numbers of the user and of the group that Ubuntu gives the first account of a person. The image of Node gives its user node the same numbers, as which the container ran Portolab before decision 0027. */
export const firstAccount = { user: 1000, group: 1000 };

// Node runs a child process as a user or a group only when its number fits a signed whole number of 32 bits.
const largestIdNumber = 2_147_483_647;

/** A folder and the names of the files in it, as root lists them. */
export interface FolderListing {
  folder: string;
  names: readonly string[];
}

/** Reads the number of a user or of a group, as `id --user` or `id --group` prints it on a line of its own. */
export function parseIdOutput(
  value: unknown,
  source: string,
): Result<number, string> {
  if (typeof value === "string" && /^(?:0|[1-9][0-9]{0,9})\n$/.test(value)) {
    const number = Number(value);
    if (number <= largestIdNumber) {
      return succeed(number);
    }
  }
  return fail(
    `${source} must be a whole number from 0 to ${String(largestIdNumber)} on a line of its own, but it is ${describeValue(value)}.`,
  );
}

/** Fails for each file of a folder with personal data, such as the folder of the backups, that a process with a user number other than root can read, as `isReadable` reports for its path. It also fails for a folder without a file, because the check would then pass without checking anything. */
export function checkFolderOnlyForRoot(
  { folder, names }: FolderListing,
  userNumber: number,
  isReadable: (path: string) => Result<boolean, string>,
): string[] {
  if (names.length === 0) {
    return [
      `${folder} holds no file after the guide, so the test cannot check who reads its files.`,
    ];
  }
  const failures: string[] = [];
  for (const name of names) {
    const path = `${folder}/${name}`;
    const readable = isReadable(path);
    if (!readable.ok) {
      failures.push(readable.failure);
    } else if (readable.value) {
      failures.push(
        `A process of the user number ${String(userNumber)} can read ${path}, so an account of the server with that number reads the personal data in it.`,
      );
    }
  }
  return failures;
}
