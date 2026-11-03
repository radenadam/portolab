import { expect, test } from "vitest";
import { describeAgentRun, parseAgentRun } from "./agent-run.ts";

const result = { type: "result", duration_ms: 361_000, num_turns: 41 };

test("reads the minutes and the turns from the last result of a transcript, rounding the minutes up", () => {
  expect(
    parseAgentRun(
      [
        { type: "system" },
        { type: "result", duration_ms: 1, num_turns: 1 },
        result,
      ],
      "transcript.json",
    ),
  ).toEqual({ ok: true, value: { minutes: 7, turns: 41 } });
});

test("counts a run that started as at least one minute", () => {
  expect(
    parseAgentRun([{ ...result, duration_ms: 0 }], "transcript.json"),
  ).toEqual({ ok: true, value: { minutes: 1, turns: 41 } });
});

test("names what is wrong with a transcript", () => {
  expect(parseAgentRun({}, "transcript.json")).toEqual({
    ok: false,
    failure: "transcript.json must be a list of messages, but it is {}.",
  });
  expect(parseAgentRun([{ type: "system" }], "transcript.json")).toEqual({
    ok: false,
    failure:
      'transcript.json must hold a message of type "result", but it has none.',
  });
  expect(
    parseAgentRun([{ ...result, num_turns: "many" }], "transcript.json"),
  ).toEqual({
    ok: false,
    failure:
      'transcript.json must have a whole number at num_turns of its result, but it is "many".',
  });
  expect(
    parseAgentRun([{ ...result, duration_ms: -1 }], "transcript.json"),
  ).toEqual({
    ok: false,
    failure:
      "transcript.json must have a duration in milliseconds at duration_ms of its result, but it is -1.",
  });
});

test("describes one minute and one turn, and several of each", () => {
  expect(describeAgentRun("verifier", { minutes: 1, turns: 1 })).toBe(
    "The verifier ran for 1 minute in 1 turn.",
  );
  expect(describeAgentRun("reviewer", { minutes: 6, turns: 41 })).toBe(
    "The reviewer ran for 6 minutes in 41 turns.",
  );
});
