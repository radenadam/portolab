import { expect, test } from "vitest";
import { parse } from "yaml";
import { isRecord } from "../app/value-shapes.ts";
import { readTextFile } from "./read-text-file.ts";
import { runCommand } from "./run-command.ts";

// Only the title of a pull request goes through commitlint in CI, and the hook of lefthook checks only local commits, so this test checks the body that the workflow gives the squash commit of an update.
const workflowPath = ".github/workflows/dependabot-auto-merge.yml";

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

test("gives the squash commit of an update a body that commitlint accepts", () => {
  const text = readTextFile(workflowPath);
  expect(text.ok).toBe(true);
  const body = commitBodyOf(parse(text.ok ? text.value : ""));
  expect(typeof body).toBe("string");
  const linted = runCommand(
    process.execPath,
    ["node_modules/@commitlint/cli/cli.js"],
    { input: `chore(deps): bump a dependency\n\n${String(body)}\n` },
  );
  expect(linted).toEqual({ ok: true, value: { code: 0, stdout: "" } });
});

test("rejects a body line longer than commitlint allows, so the test above can fail", () => {
  const linted = runCommand(
    process.execPath,
    ["node_modules/@commitlint/cli/cli.js"],
    { input: `chore(deps): bump a dependency\n\n${"a".repeat(101)}\n` },
  );
  expect(linted.ok).toBe(false);
});
