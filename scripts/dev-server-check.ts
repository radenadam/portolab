import { isRecord } from "../app/value-shapes.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

/** Reads the arguments of the dev script in package.json. The check runs them through its own Node binary, so the script must start with "node". */
export function parseDevArguments(
  value: unknown,
  source: string,
): Result<string[], string> {
  const scripts = isRecord(value) ? value["scripts"] : undefined;
  const devScript = isRecord(scripts) ? scripts["dev"] : undefined;
  if (typeof devScript !== "string") {
    return fail(`${source} has no dev script.`);
  }
  const [program, ...devArguments] = devScript.split(" ");
  return program === "node"
    ? succeed(devArguments)
    : fail(
        `${source} must start its dev script with "node", so the check can run it, but it starts with "${String(program)}".`,
      );
}

export interface PageAnswer {
  path: string;
  status: number;
}

/** Returns one sentence for each page that did not answer with a success status. */
export function pageProblems(answers: readonly PageAnswer[]): string[] {
  const problems: string[] = [];
  for (const answer of answers) {
    if (answer.status < 200 || answer.status > 299) {
      problems.push(
        `${answer.path} answered with status ${String(answer.status)}.`,
      );
    }
  }
  return problems;
}
