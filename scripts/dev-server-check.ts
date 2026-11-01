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

/** A module of the app as the check reads it. */
export interface SourceModule {
  path: string;
  text: string;
}

/** Whether a path names a module of the app that the check reads, which leaves out tests and the code that Paraglide generates. */
export function isAppModule(path: string): boolean {
  return (
    /^app\/.+\.tsx?$/.test(path) &&
    !/\.test\.tsx?$/.test(path) &&
    !path.startsWith("app/paraglide/")
  );
}

/** Chooses the modules that the check edits in the running dev server. These are each module that creates a context, through which the server hands a service to loaders, and each schema of the database, because a reload of such a module once lost a service. */
export function modulesToEdit(modules: readonly SourceModule[]): string[] {
  const chosen: string[] = [];
  for (const module of modules) {
    if (
      module.path.endsWith(".schema.ts") ||
      /\bcreateContext\s*[<(]/.test(module.text)
    ) {
      chosen.push(module.path);
    }
  }
  return chosen;
}
