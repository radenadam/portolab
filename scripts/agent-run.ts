import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { countOf } from "../app/sentences.ts";
import { minuteMilliseconds } from "../app/time-units.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";

/** What one agent of the panel used, so that a change to the panel can be measured against the last one. */
export interface AgentRun {
  minutes: number;
  turns: number;
}

/** Reads the transcript that Claude Code's GitHub Action writes, a list of messages whose last message of type "result" holds the duration and the turns of the run. */
export function parseAgentRun(
  value: unknown,
  source: string,
): Result<AgentRun, string> {
  if (!Array.isArray(value)) {
    return fail(
      `${source} must be a list of messages, but it is ${describeValue(value)}.`,
    );
  }
  const result: unknown = value.findLast(
    (message) => isRecord(message) && message["type"] === "result",
  );
  if (!isRecord(result)) {
    return fail(
      `${source} must hold a message of type "result", but it has none.`,
    );
  }
  const duration = result["duration_ms"];
  const turns = result["num_turns"];
  if (typeof duration !== "number" || duration < 0) {
    return fail(
      `${source} must have a duration in milliseconds at duration_ms of its result, but it is ${describeValue(duration)}.`,
    );
  }
  if (typeof turns !== "number" || !Number.isInteger(turns) || turns < 0) {
    return fail(
      `${source} must have a whole number at num_turns of its result, but it is ${describeValue(turns)}.`,
    );
  }
  // A run that starts counts as at least one minute, so no run reads as free.
  return succeed({
    minutes: Math.max(1, Math.ceil(duration / minuteMilliseconds)),
    turns,
  });
}

/** One sentence about the run of an agent, such as "The reviewer ran for 6 minutes in 41 turns." */
export function describeAgentRun(agent: string, run: AgentRun): string {
  return `The ${agent} ran for ${countOf(run.minutes, "minute", "minutes")} in ${countOf(run.turns, "turn", "turns")}.`;
}
