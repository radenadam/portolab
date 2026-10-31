import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";
import { parseStringAt } from "./json.ts";

/** Reads the arguments of the dev script in package.json. The check runs them through its own Node binary, so the script must start with "node". */
export function parseDevArguments(
  value: unknown,
  source: string,
): Result<string[], string> {
  const devScript = parseStringAt(value, source, ["scripts", "dev"]);
  if (!devScript.ok) {
    return devScript;
  }
  const [program, ...devArguments] = devScript.value.split(" ");
  return program === "node"
    ? succeed(devArguments)
    : fail(
        `${source} must start its dev script with "node", so the check can run it, but it starts with ${describeValue(program)}.`,
      );
}

export interface PageAnswer {
  path: string;
  /** The status of the answer, or the reason that the request got no answer. */
  outcome: { status: number } | { connectionFailure: string };
}

/** Returns one sentence for each page that did not answer with a success status, and says when, such as "at startup". */
export function pageProblems(
  answers: readonly PageAnswer[],
  moment: string,
): string[] {
  const problems: string[] = [];
  for (const { path, outcome } of answers) {
    if ("connectionFailure" in outcome) {
      problems.push(
        `${path} did not answer ${moment}. The connection reported: ${outcome.connectionFailure}`,
      );
    } else if (outcome.status < 200 || outcome.status > 299) {
      problems.push(
        `${path} answered with status ${String(outcome.status)} ${moment}.`,
      );
    }
  }
  return problems;
}
