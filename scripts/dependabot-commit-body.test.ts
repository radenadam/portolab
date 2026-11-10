import { expect, test } from "vitest";
import { parse } from "yaml";
import { secondMilliseconds } from "../app/time-units.ts";
import { isRecord } from "../app/value-shapes.ts";
import { readTextFile } from "./read-text-file.ts";
import { runCommand } from "./run-command.ts";

// Only the title of a pull request goes through commitlint in CI, and the hook of lefthook checks only local commits, so this test checks the body that the workflow gives the squash commit of an update.
const workflowPath = ".github/workflows/dependabot-auto-merge.yml";

// Each test starts commitlint in a new process, which takes about a second warm and once ran past the 5 seconds that Vitest allows by default on a cold start under the load of the other tests.
const commitlintTestTimeoutMilliseconds = 30 * secondMilliseconds;

/** Finds the commit body that a step of the workflow sets in its environment. */
function commitBodyOf(workflow: unknown): unknown {
  const jobs = isRecord(workflow) ? workflow["jobs"] : undefined;
  for (const job of isRecord(jobs) ? Object.values(jobs) : []) {
    const steps = isRecord(job) ? job["steps"] : undefined;
    for (const step of Array.isArray(steps) ? steps : []) {
      const environment = isRecord(step) ? step["env"] : undefined;
      if (isRecord(environment) && "COMMIT_BODY" in environment) {
        return environment["COMMIT_BODY"];
      }
    }
  }
  return undefined;
}

/** Runs commitlint on a commit of an update with this body, as the hook of lefthook runs it on a local commit. */
function lintCommitBody(body: string): ReturnType<typeof runCommand> {
  return runCommand(process.execPath, ["node_modules/@commitlint/cli/cli.js"], {
    input: `chore(deps): bump a dependency\n\n${body}\n`,
  });
}

test(
  "gives the squash commit of an update a body that commitlint accepts",
  () => {
    const text = readTextFile(workflowPath);
    expect(text.ok).toBe(true);
    const body = commitBodyOf(parse(text.ok ? text.value : ""));
    expect(typeof body).toBe("string");
    expect(lintCommitBody(String(body))).toEqual({
      ok: true,
      value: { code: 0, stdout: "" },
    });
  },
  commitlintTestTimeoutMilliseconds,
);

test(
  "rejects a body line longer than commitlint allows, so the test above can fail",
  () => {
    expect(lintCommitBody("a".repeat(101)).ok).toBe(false);
  },
  commitlintTestTimeoutMilliseconds,
);
