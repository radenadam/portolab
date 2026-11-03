import { readdirSync } from "node:fs";
import { expect, test } from "vitest";
import { readTextFile } from "./read-text-file.ts";
import {
  parseAgentTools,
  parseCommitHash,
  parseOptionalCommitHashAt,
  parsePullRequestNumber,
} from "./review-inputs.ts";

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
