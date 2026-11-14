import { readdirSync } from "node:fs";

export function decisionNumberProblems(folder: string): string[] {
  const recordsByNumber = new Map<string, string[]>();
  const entries = readdirSync(folder, { withFileTypes: true }).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  for (const entry of entries) {
    const prefix = /^([0-9]+)-.+\.md$/.exec(entry.name)?.[1];
    if (!entry.isFile() || prefix === undefined) {
      continue;
    }
    const number = BigInt(prefix).toString();
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
  for (const [number, records] of recordsByNumber) {
    if (records.length > 1) {
      problems.push(
        `${folder}: decision number ${number} is shared by ${records.join(", ")}. Renumber the record in your pull request and update its heading, links, and mentions.`,
      );
    }
  }
  return problems;
}
