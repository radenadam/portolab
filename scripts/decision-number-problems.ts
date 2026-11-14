import { readdirSync } from "node:fs";
import { describeValue } from "../app/value-shapes.ts";
import { readTextFile } from "./read-text-file.ts";

export function decisionNumberProblems(folder: string): string[] {
  const recordsByNumber = new Map<bigint, string[]>();
  const entries = readdirSync(folder, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    const prefix = /^([0-9]+)-.+\.md$/.exec(entry.name)?.[1];
    if (!entry.isFile() || prefix === undefined) {
      continue;
    }
    const number = BigInt(prefix);
    const records = recordsByNumber.get(number) ?? [];
    records.push(entry.name);
    recordsByNumber.set(number, records);
  }

  const problems: string[] = [];
  if (recordsByNumber.size === 0) {
    problems.push(
      `${folder} must contain numbered decision records, but it has none.`,
    );
  }
  const groups = [...recordsByNumber].sort(([left], [right]) => {
    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
    return 0;
  });
  const filenames: string[] = [];
  for (const [number, records] of groups) {
    filenames.push(...records);
    if (records.length > 1) {
      problems.push(
        `${folder}: decision number ${String(number)} is shared by ${records.join(", ")}. Renumber the record in your pull request and update its heading, links, mentions, and index entry.`,
      );
    }
  }
  const indexPath = `${folder}/index.txt`;
  const index = readTextFile(indexPath);
  const expected = filenames.length === 0 ? "" : `${filenames.join("\n")}\n`;
  if (!index.ok) {
    problems.push(index.failure);
  } else if (index.value.replaceAll("\r\n", "\n") !== expected) {
    problems.push(
      `${indexPath} must be ${describeValue(expected)}, but it is ${describeValue(index.value)}. Update its list of decision filenames with the record in your pull request.`,
    );
  }
  return problems;
}
