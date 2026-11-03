import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";
import { measureAgentRun } from "./agent-run.ts";

const folder = mkdtempSync(join(tmpdir(), "agent-run-"));
const transcript = join(folder, "transcript.json");

afterAll(() => {
  rmSync(folder, { recursive: true, force: true });
});

/** Measures the run of the reviewer from a transcript that holds these messages. */
function measure(messages: unknown): string {
  writeFileSync(transcript, JSON.stringify(messages));
  return measureAgentRun("reviewer", transcript);
}

function result(milliseconds: number, turns: number): unknown {
  return { type: "result", duration_ms: milliseconds, num_turns: turns };
}

test("measures from the last result of a transcript, in minutes rounded up, with one turn or several", () => {
  expect(measure([{ type: "system" }, result(1, 1), result(300_001, 41)])).toBe(
    "The reviewer ran for 6 minutes in 41 turns.",
  );
  expect(measure([result(60_000, 1)])).toBe(
    "The reviewer ran for 1 minute in 1 turn.",
  );
});

test("measures a run shorter than a minute in seconds rounded up, because a review of seconds read almost nothing", () => {
  expect(measure([result(9_288, 5)])).toBe(
    "The reviewer ran for 10 seconds in 5 turns.",
  );
  expect(measure([result(59_999, 5)])).toBe(
    "The reviewer ran for 60 seconds in 5 turns.",
  );
  expect(measure([result(0, 5)])).toBe(
    "The reviewer ran for 1 second in 5 turns.",
  );
});

test("says why a transcript cannot be measured, instead of failing the round", () => {
  const unmeasured = `The run of the reviewer could not be measured. ${transcript}`;
  expect(measure({})).toBe(
    `${unmeasured} must be a list of messages, but it is {}.`,
  );
  expect(measure([{ type: "system" }])).toBe(
    `${unmeasured} must hold a message of type "result", but it has none.`,
  );
  expect(measure([{ type: "result", duration_ms: 1, num_turns: "many" }])).toBe(
    `${unmeasured} must have a whole number at num_turns of its result, but it is "many".`,
  );
  expect(measure([{ type: "result", duration_ms: -1, num_turns: 1 }])).toBe(
    `${unmeasured} must have a duration in milliseconds at duration_ms of its result, but it is -1.`,
  );
  expect(measureAgentRun("verifier", join(folder, "missing.json"))).toContain(
    "The run of the verifier could not be measured.",
  );
});
