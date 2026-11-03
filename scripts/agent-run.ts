import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { countOf } from "../app/sentences.ts";
import { minuteMilliseconds, secondMilliseconds } from "../app/time-units.ts";
import { describeValue, isRecord } from "../app/value-shapes.ts";
import { readJsonFile } from "./json.ts";

/** What one agent of the panel used, so that a change to the panel can be measured against the last one. */
interface AgentRun {
  milliseconds: number;
  turns: number;
}

/** The agents of the panel, whose transcripts the workflow measures. */
export const panelAgents = ["reviewer", "verifier"] as const;

/** Reads the transcript that Claude Code's GitHub Action writes, a list of messages whose last message of type "result" holds the duration and the turns of the run. */
function parseAgentRun(
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
  return succeed({ milliseconds: duration, turns });
}

/** One sentence about the run of an agent, such as "The reviewer ran for 6 minutes in 41 turns." A run shorter than a minute is given in seconds, because a review of seconds shows that the agent read almost nothing. Each part is rounded up, so no run reads as free. */
function describeAgentRun(agent: string, run: AgentRun): string {
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

/** One sentence about the run of an agent from its transcript, or about why the run could not be measured. The measure does not decide the review, so a transcript that cannot be read leaves it unknown instead of failing the round. */
export function measureAgentRun(agent: string, transcriptPath: string): string {
  const run = readJsonFile(transcriptPath, parseAgentRun);
  return run.ok
    ? describeAgentRun(agent, run.value)
    : `The run of the ${agent} could not be measured. ${run.failure}`;
}
