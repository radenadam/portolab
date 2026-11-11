import { expect, test } from "vitest";
import { fail, succeed } from "../app/result.ts";
import { backupFolder } from "./deployment-guide.ts";
import { checkFolderOnlyForRoot, parseIdOutput } from "./user-numbers.ts";

test("accepts a folder that a process of another user number can read none of, and checks each file at its path", () => {
  for (const [folder, names, paths] of [
    [
      backupFolder,
      ["portolab-2026-11-10.sqlite", "portolab-2026-11-11.sqlite"],
      [
        "/var/backups/portolab/portolab-2026-11-10.sqlite",
        "/var/backups/portolab/portolab-2026-11-11.sqlite",
      ],
    ],
    [
      "/proc/4242/root/app/data",
      ["portolab.sqlite", "portolab.sqlite-wal"],
      [
        "/proc/4242/root/app/data/portolab.sqlite",
        "/proc/4242/root/app/data/portolab.sqlite-wal",
      ],
    ],
  ] as const) {
    const checkedPaths: string[] = [];
    expect(
      checkFolderOnlyForRoot({ folder, names }, 1000, (path) => {
        checkedPaths.push(path);
        return succeed(false);
      }),
    ).toEqual([]);
    expect(checkedPaths).toEqual(paths);
  }
});

test("fails for each file of the folder that a process of another user number can read", () => {
  expect(
    checkFolderOnlyForRoot(
      {
        folder: backupFolder,
        names: [
          "portolab-2026-11-10.sqlite",
          "portolab-2026-11-11.sqlite",
          "unfinished.sqlite",
        ],
      },
      61000,
      (path) => succeed(!path.endsWith("portolab-2026-11-11.sqlite")),
    ),
  ).toEqual([
    "A process of the user number 61000 can read /var/backups/portolab/portolab-2026-11-10.sqlite, so an account of the server with that number reads the personal data in it.",
    "A process of the user number 61000 can read /var/backups/portolab/unfinished.sqlite, so an account of the server with that number reads the personal data in it.",
  ]);
  expect(
    checkFolderOnlyForRoot(
      { folder: "/proc/4242/root/app/data", names: ["portolab.sqlite"] },
      1000,
      () => succeed(true),
    ),
  ).toEqual([
    "A process of the user number 1000 can read /proc/4242/root/app/data/portolab.sqlite, so an account of the server with that number reads the personal data in it.",
  ]);
});

test("fails for a folder without a file, because the check would pass without checking anything", () => {
  expect(
    checkFolderOnlyForRoot({ folder: backupFolder, names: [] }, 1000, () =>
      succeed(false),
    ),
  ).toEqual([
    "/var/backups/portolab holds no file after the guide, so the test cannot check who reads its files.",
  ]);
});

test("passes on why it could not tell whether a process of another user number can read a file", () => {
  const failure =
    "test -r /var/backups/portolab/portolab-2026-11-11.sqlite ended with code 2. test: missing argument";
  expect(
    checkFolderOnlyForRoot(
      { folder: backupFolder, names: ["portolab-2026-11-11.sqlite"] },
      1000,
      () => fail(failure),
    ),
  ).toEqual([failure]);
});

test("reads the number of a user or of a group as id prints it", () => {
  for (const [output, number] of [
    ["0\n", 0],
    ["1000\n", 1000],
    ["2147483647\n", 2_147_483_647],
  ] as const) {
    expect(parseIdOutput(output, "The output of id --user")).toEqual({
      ok: true,
      value: number,
    });
  }
});

test("rejects an output of id that is not one whole number on a line of its own, or that Node cannot run a process as", () => {
  for (const [output, description] of [
    ["", "empty"],
    ["1000", '"1000"'],
    ["1000\n1000\n", '"1000\\n1000\\n"'],
    ["01000\n", '"01000\\n"'],
    ["-1\n", '"-1\\n"'],
    ["node\n", '"node\\n"'],
    ["2147483648\n", '"2147483648\\n"'],
    [1000, "1000"],
  ] as const) {
    expect(parseIdOutput(output, "The output of id --user")).toEqual({
      ok: false,
      failure: `The output of id --user must be a whole number from 0 to 2147483647 on a line of its own, but it is ${description}.`,
    });
  }
});
