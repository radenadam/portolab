import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { readTextFile } from "./read-text-file.ts";
import {
  parseAgentTools,
  parseBranchName,
  parseCommitHash,
  parseJobResults,
  parseOptionalCommitHashAt,
  parsePullRequestNumber,
  readLensTools,
} from "./review-inputs.ts";
import { lenses } from "./review-lenses.ts";

const reviewedHead = "1".repeat(40);

test("accepts a pull request number and rejects anything else", () => {
  expect(parsePullRequestNumber("12", "PULL_REQUEST")).toEqual({
    ok: true,
    value: "12",
  });
  expect(parsePullRequestNumber("", "PULL_REQUEST")).toEqual({
    ok: false,
    failure: "PULL_REQUEST must be a pull request number, but it is empty.",
  });
});

test("accepts the full hash of a commit and rejects anything else", () => {
  expect(parseCommitHash(reviewedHead, "REVIEWED_HEAD")).toEqual({
    ok: true,
    value: reviewedHead,
  });
  expect(parseCommitHash(undefined, "REVIEWED_HEAD")).toEqual({
    ok: false,
    failure:
      "REVIEWED_HEAD must be the full hash of a commit, but it is missing.",
  });
});

test("reads the tools of every agent definition in the repository", () => {
  for (const file of readdirSync(".claude/agents")) {
    const path = `.claude/agents/${file}`;
    const definition = readTextFile(path);
    expect(
      definition.ok ? parseAgentTools(definition.value, path) : definition,
    ).toEqual({
      ok: true,
      value: "Read,Grep,Glob,Bash",
    });
  }
});

test("rejects an agent definition without a tools line or with a wrong list", () => {
  expect(parseAgentTools("---\nname: x\n---", "x.md")).toEqual({
    ok: false,
    failure:
      'x.md must list its tools on one line that starts with "tools: ", separated by commas, but that list is missing.',
  });
  expect(parseAgentTools("tools: Read, Grep!", "x.md")).toEqual({
    ok: false,
    failure:
      'x.md must list its tools on one line that starts with "tools: ", separated by commas, but that list is "Read, Grep!".',
  });
});

test("reads a field that holds a commit or nothing, and names the field when it holds something else", () => {
  expect(
    parseOptionalCommitHashAt({ head: reviewedHead }, "plan.json", "head"),
  ).toEqual({ ok: true, value: reviewedHead });
  expect(parseOptionalCommitHashAt({}, "plan.json", "head")).toEqual({
    ok: true,
    value: undefined,
  });
  expect(
    parseOptionalCommitHashAt({ head: "main" }, "plan.json", "head"),
  ).toEqual({
    ok: false,
    failure:
      'plan.json: head must be the full hash of a commit, but it is "main".',
  });
});

test("accepts the name of a branch, with or without folders, and rejects anything else", () => {
  for (const branch of ["main", "release/1.x", "fix/review-proves-coverage"]) {
    expect(parseBranchName(branch, "BASE_REF")).toEqual({
      ok: true,
      value: branch,
    });
  }
  for (const value of ["", "main; rm", "/main", "main/", undefined]) {
    expect(parseBranchName(value, "BASE_REF").ok, String(value)).toBe(false);
  }
  expect(parseBranchName("main; rm", "BASE_REF")).toEqual({
    ok: false,
    failure: 'BASE_REF must be the name of a branch, but it is "main; rm".',
  });
});

test("reads the tools of every lens of the panel as one list without repeats", () => {
  expect(readLensTools(lenses)).toEqual({
    ok: true,
    value: "Read,Grep,Glob,Bash",
  });
  expect(readLensTools([])).toEqual({ ok: true, value: "" });
});

test("reads the result of each job, and refuses an empty needs context or a job without a result", () => {
  expect(
    parseJobResults(
      { plan: { result: "success" }, reviewer: { result: "cancelled" } },
      "PANEL_RESULTS",
    ),
  ).toEqual({ ok: true, value: { plan: "success", reviewer: "cancelled" } });
  expect(parseJobResults({}, "PANEL_RESULTS")).toEqual({
    ok: false,
    failure: "PANEL_RESULTS must name at least one job, but it is {}.",
  });
  expect(
    parseJobResults(
      { plan: { result: "success" }, reviewer: {} },
      "PANEL_RESULTS",
    ),
  ).toEqual({
    ok: false,
    failure:
      "PANEL_RESULTS: job reviewer must have a string at result, but result is missing.",
  });
});
