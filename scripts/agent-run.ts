import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { countOf } from "../app/sentences.ts";
import { minuteMilliseconds, secondMilliseconds } from "../app/time-units.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";

/** What one agent of the panel used, so that a change to the panel can be measured against the last one. */
export interface AgentRun {
  milliseconds: number;
  turns: number;
}

/** Reads the transcript that Claude Code's GitHub Action writes, a list of messages whose last message of type "result" holds the duration and the turns of the run. */
export function parseTranscriptRun(
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
  return runFromNumbers(result["duration_ms"], result["num_turns"], source);
}

/** Reads the measure that the job of an agent gives as its output. The agent could change it, as it can change every later step of its job, so the review job parses it like any output of an agent. */
export function parseAgentRun(
  value: unknown,
  source: string,
): Result<AgentRun, string> {
  return isRecord(value)
    ? runFromNumbers(value["milliseconds"], value["turns"], source)
    : fail(
        `${source} must be a JSON object, but it is ${describeValue(value)}.`,
      );
}

function runFromNumbers(
  milliseconds: unknown,
  turns: unknown,
  source: string,
): Result<AgentRun, string> {
  if (
    typeof milliseconds !== "number" ||
    !Number.isInteger(milliseconds) ||
    milliseconds < 0
  ) {
    return fail(
      `${source} must give the duration as a whole number of milliseconds from 0, but it is ${describeValue(milliseconds)}.`,
    );
  }
  if (typeof turns !== "number" || !Number.isInteger(turns) || turns < 0) {
    return fail(
      `${source} must give the turns as a whole number from 0, but it is ${describeValue(turns)}.`,
    );
  }
  return succeed({ milliseconds, turns });
}

/** One sentence about the run of an agent, such as "The reviewer ran for 6 minutes in 41 turns." A run shorter than a minute is given in seconds, because a review of seconds shows that the agent read almost nothing. Each part is rounded up, so no run reads as free. */
export function describeAgentRun(agent: string, run: AgentRun): string {
  const duration =
    run.milliseconds < minuteMilliseconds
      ? countOf(
          Math.max(1, Math.ceil(run.milliseconds / secondMilliseconds)),
          "second",
          "seconds",
        )
      : countOf(
          Math.ceil(run.milliseconds / minuteMilliseconds),
          "minute",
          "minutes",
        );
  return `The ${agent} ran for ${duration} in ${countOf(run.turns, "turn", "turns")}.`;
}
