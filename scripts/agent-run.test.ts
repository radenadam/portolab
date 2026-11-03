import { expect, test } from "vitest";
import {
  describeAgentRun,
  parseAgentRun,
  parseTranscriptRun,
} from "./agent-run.ts";

function result(milliseconds: unknown, turns: unknown): unknown {
  return { type: "result", duration_ms: milliseconds, num_turns: turns };
}

test("reads the duration and the turns from the last result of a transcript", () => {
  expect(
    parseTranscriptRun(
      [{ type: "system" }, result(1, 1), result(300_001, 41)],
      "transcript.json",
    ),
  ).toEqual({ ok: true, value: { milliseconds: 300_001, turns: 41 } });
});

test("says what is wrong with a transcript", () => {
  expect(parseTranscriptRun({}, "transcript.json")).toEqual({
    ok: false,
    failure: "transcript.json must be a list of messages, but it is {}.",
  });
  expect(parseTranscriptRun([{ type: "system" }], "transcript.json")).toEqual({
    ok: false,
    failure:
      'transcript.json must hold a message of type "result", but it has none.',
  });
  expect(parseTranscriptRun([result(1, "many")], "transcript.json")).toEqual({
    ok: false,
    failure:
      'transcript.json must give the turns as a whole number from 0, but it is "many".',
  });
  expect(parseTranscriptRun([result(-1, 1)], "transcript.json")).toEqual({
    ok: false,
    failure:
      "transcript.json must give the duration as a whole number of milliseconds from 0, but it is -1.",
  });
});

test("reads the measure that the job of an agent gives, and rejects anything else", () => {
  expect(
    parseAgentRun({ milliseconds: 9_288, turns: 5 }, "REVIEWER_RUN"),
  ).toEqual({ ok: true, value: { milliseconds: 9_288, turns: 5 } });
  expect(parseAgentRun("fast", "REVIEWER_RUN")).toEqual({
    ok: false,
    failure: 'REVIEWER_RUN must be a JSON object, but it is "fast".',
  });
  expect(
    parseAgentRun({ milliseconds: 1.5, turns: 5 }, "REVIEWER_RUN"),
  ).toEqual({
    ok: false,
    failure:
      "REVIEWER_RUN must give the duration as a whole number of milliseconds from 0, but it is 1.5.",
  });
});

test("describes a run of a minute or more in minutes, rounded up, with one turn or several", () => {
  expect(describeAgentRun("verifier", { milliseconds: 60_000, turns: 1 })).toBe(
    "The verifier ran for 1 minute in 1 turn.",
  );
  expect(
    describeAgentRun("reviewer", { milliseconds: 300_001, turns: 41 }),
  ).toBe("The reviewer ran for 6 minutes in 41 turns.");
});

test("describes a run shorter than a minute in seconds, rounded up, because a review of seconds read almost nothing", () => {
  expect(describeAgentRun("reviewer", { milliseconds: 0, turns: 5 })).toBe(
    "The reviewer ran for 1 second in 5 turns.",
  );
  expect(describeAgentRun("reviewer", { milliseconds: 9_288, turns: 5 })).toBe(
    "The reviewer ran for 10 seconds in 5 turns.",
  );
  expect(describeAgentRun("reviewer", { milliseconds: 59_999, turns: 5 })).toBe(
    "The reviewer ran for 60 seconds in 5 turns.",
  );
});
