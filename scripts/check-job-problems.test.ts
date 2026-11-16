import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { parse } from "yaml";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { checkJobProblems } from "./check-job-problems.ts";
import { parseJsonObject } from "./json.ts";

const source = "CHECK_RESULTS";
const workflow = successValueForTest(
  parseJsonObject(
    parse(readFileSync(".github/workflows/check.yml", "utf8")),
    ".github/workflows/check.yml",
  ),
  "reads the Check workflow",
);
const jobs = successValueForTest(
  parseJsonObject(workflow["jobs"], "Check jobs"),
  "reads its jobs",
);
const checkJobIds = Object.keys(jobs).filter((job) => job !== "check");

function successfulJobs(): Record<string, unknown> {
  return Object.fromEntries(
    checkJobIds.map((job) => [job, { result: "success", outputs: {} }]),
  );
}

test("accepts only a successful result from every expected job", () => {
  expect(checkJobProblems(successfulJobs(), source)).toEqual([]);
  for (const job of checkJobIds) {
    for (const result of ["failure", "cancelled", "skipped", "", "unknown"]) {
      expect(
        checkJobProblems({ ...successfulJobs(), [job]: { result } }, source),
      ).toEqual([
        `CHECK_RESULTS: the job ${job} must succeed, but its result is "${result}".`,
      ]);
    }
  }
});

test("names every missing or malformed result and every unsuccessful job together", () => {
  expect(
    checkJobProblems(
      {
        fast: { result: "failure" },
        "browser-1": { result: "cancelled" },
        "browser-2": { result: "skipped" },
        "browser-3": { result: 0 },
        "browser-4": {},
      },
      source,
    ),
  ).toEqual([
    'CHECK_RESULTS: the job fast must succeed, but its result is "failure".',
    'CHECK_RESULTS: the job browser-1 must succeed, but its result is "cancelled".',
    'CHECK_RESULTS: the job browser-2 must succeed, but its result is "skipped".',
    "CHECK_RESULTS must have a string at browser-3.result, but browser-3.result is 0.",
    "CHECK_RESULTS must have a string at browser-4.result, but browser-4.result is missing.",
    ...checkJobIds
      .slice(5)
      .map(
        (job) =>
          `CHECK_RESULTS must have a string at ${job}.result, but ${job}.result is missing.`,
      ),
  ]);
  expect(checkJobProblems({}, source)).toEqual(
    checkJobIds.map(
      (job) =>
        `CHECK_RESULTS must have a string at ${job}.result, but ${job}.result is missing.`,
    ),
  );
  for (const job of checkJobIds) {
    for (const value of [undefined, null, [], "success", { result: null }]) {
      expect(
        checkJobProblems({ ...successfulJobs(), [job]: value }, source),
      ).toHaveLength(1);
    }
  }
});

test("waits for every independent job and always runs the required gate in the real workflow", () => {
  expect(workflow).toHaveProperty("jobs.check.name", "check");
  expect(workflow).toHaveProperty("jobs.check.if", "${{ always() }}");
  expect(workflow).toHaveProperty("jobs.check.needs", checkJobIds);
  expect(workflow).toHaveProperty(
    "env.BROWSER_SHARDS",
    String(checkJobIds.length - 1),
  );
  expect(workflow).toHaveProperty("jobs.fast.steps", expect.any(Array));
  for (const [index, job] of checkJobIds.slice(1).entries()) {
    expect(workflow).toHaveProperty(
      `jobs.${job}.env.SHARD_INDEX`,
      String(index + 1),
    );
    expect(workflow).not.toHaveProperty(`jobs.${job}.needs`);
  }
});

function runGate(value: string | undefined) {
  const child = spawnSync(process.execPath, ["scripts/check-job-results.ts"], {
    env: { ...process.env, [source]: value },
    encoding: "utf8",
    timeout: 10_000,
  });
  expect(child.error).toBeUndefined();
  expect(child.signal).toBeNull();
  expect(child.stdout).toBe("");
  return child;
}

test.each([undefined, "", "{bad", "[]", "{}"])(
  "reports gate failures to stderr and exits unsuccessfully for %j",
  (value) => {
    const child = runGate(value);
    expect(child.status).toBe(1);
    expect(child.stderr).toContain(source);
    if (value === "{}") {
      for (const job of checkJobIds) {
        expect(child.stderr).toContain(`${job}.result is missing.`);
      }
    }
  },
);

test("exits successfully through the entry point when every job succeeds", () => {
  const child = runGate(JSON.stringify(successfulJobs()));
  expect(child.status).toBe(0);
  expect(child.stderr).toBe("");
});
