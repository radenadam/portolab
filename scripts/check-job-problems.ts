import { parseStringAt } from "./json.ts";

const checkJobIds = [
  "fast",
  "browser-1",
  "browser-2",
  "browser-3",
  "browser-4",
  "browser-5",
  "browser-6",
  "browser-7",
  "browser-8",
];

export function checkJobProblems(
  results: Record<string, unknown>,
  source: string,
): string[] {
  const problems: string[] = [];
  for (const job of checkJobIds) {
    const result = parseStringAt(results, source, [job, "result"]);
    if (!result.ok) {
      problems.push(result.failure);
    } else if (result.value !== "success") {
      problems.push(
        `${source}: the job ${job} must succeed, but its result is "${result.value}".`,
      );
    }
  }
  return problems;
}
