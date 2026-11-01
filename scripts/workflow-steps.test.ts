import { expect, test } from "vitest";
import {
  isWorkflowFile,
  parseWorkflowJobs,
  timeLimitProblems,
} from "./workflow-steps.ts";

const source = ".github/workflows/check.yml";

/** Reads the jobs of a workflow and returns its problems, so a test sees what the check reports. */
function problemsOf(workflow: string): string[] {
  const jobs = parseWorkflowJobs(workflow, source);
  return jobs.ok ? timeLimitProblems(source, jobs.value) : [jobs.failure];
}

test("chooses the workflows of GitHub Actions and no other file", () => {
  for (const path of [
    ".github/workflows/check.yml",
    ".github/workflows/review.yaml",
  ]) {
    expect(isWorkflowFile(path), path).toBe(true);
  }
  for (const path of [
    ".github/actions/install-browser/action.yml",
    ".github/review/route.schema.json",
    "lefthook.yml",
  ]) {
    expect(isWorkflowFile(path), path).toBe(false);
  }
});

test("accepts a workflow whose every step has a time limit below the limit of its job", () => {
  expect(
    problemsOf(`jobs:
  check:
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7
        timeout-minutes: 5
      - name: Run every check
        run: pnpm check
        timeout-minutes: 15
`),
  ).toEqual([]);
});

test("rejects a step without a time limit, naming the step by its name, by what it uses, or by what it runs", () => {
  expect(
    problemsOf(`jobs:
  check:
    timeout-minutes: 20
    steps:
      - name: Run every check
        run: pnpm check
      - uses: actions/checkout@v7
      - run: pnpm exec commitlint
`),
  ).toEqual([
    '.github/workflows/check.yml: the step "Run every check" of the job check must have a timeout-minutes below the 20 minutes of its job, but it has none.',
    '.github/workflows/check.yml: the step "actions/checkout@v7" of the job check must have a timeout-minutes below the 20 minutes of its job, but it has none.',
    '.github/workflows/check.yml: the step "pnpm exec commitlint" of the job check must have a timeout-minutes below the 20 minutes of its job, but it has none.',
  ]);
});

test("rejects a step whose time limit is not below the limit of its job", () => {
  expect(
    problemsOf(`jobs:
  check:
    timeout-minutes: 20
    steps:
      - name: Run every check
        run: pnpm check
        timeout-minutes: 20
`),
  ).toEqual([
    '.github/workflows/check.yml: the step "Run every check" of the job check must have a timeout-minutes below the 20 minutes of its job, but it has 20.',
  ]);
});

test("rejects a job without a time limit", () => {
  expect(
    problemsOf(`jobs:
  check:
    steps:
      - run: pnpm check
        timeout-minutes: 15
`),
  ).toEqual([
    ".github/workflows/check.yml: the job check must have a timeout-minutes, but it has none.",
  ]);
});

test("names the source and the field of a workflow that it cannot read", () => {
  expect(problemsOf("jobs: [unclosed")[0]).toMatch(
    /^\.github\/workflows\/check\.yml must be valid YAML, but it is not\. The parser reported: \S/,
  );
  expect(problemsOf("name: Check\n")).toEqual([
    ".github/workflows/check.yml must have an object at jobs, but jobs is missing.",
  ]);
  expect(problemsOf("jobs:\n  check:\n    timeout-minutes: 20\n")).toEqual([
    ".github/workflows/check.yml: the job check must have a list at steps, but steps is missing.",
  ]);
  expect(
    problemsOf(
      "jobs:\n  check:\n    timeout-minutes: 20\n    steps:\n      - run: pnpm check\n        timeout-minutes: soon\n",
    ),
  ).toEqual([
    '.github/workflows/check.yml: the job check, step 1 must have a whole number of minutes at timeout-minutes, but it is "soon".',
  ]);
  expect(parseWorkflowJobs(42, source)).toEqual({
    ok: false,
    failure:
      ".github/workflows/check.yml must be the text of a workflow, but it is 42.",
  });
});
