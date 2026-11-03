import { spawnSync } from "node:child_process";
import { minuteMilliseconds } from "../app/time-units.ts";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";

interface CommandOptions {
  /** Exit codes that answer a question instead of reporting a failure, such as 1 from `git merge-base --is-ancestor`. */
  answerCodes?: readonly number[];
  /** The text that the command reads from its standard input. */
  input?: string;
}

// A request to GitHub or a command of git that hangs ends after this, so the step fails with the reason before CI stops it.
const commandTimeoutMilliseconds = minuteMilliseconds;

// A diff of a large change can hold many megabytes, and Node stops a command whose output passes its buffer.
const outputLimitBytes = 256 * 1024 * 1024;

export interface CommandOutput {
  code: number;
  stdout: string;
}

/** Runs a command and returns its standard output, or a failure that names its exit code or signal and passes on its standard error. */
export function runCommand(
  command: string,
  commandArguments: readonly string[],
  options: CommandOptions = {},
): Result<CommandOutput, string> {
  const run = spawnSync(command, commandArguments, {
    encoding: "utf8",
    input: options.input,
    maxBuffer: outputLimitBytes,
    timeout: commandTimeoutMilliseconds,
  });
  const name = [command, ...commandArguments.slice(0, 2)].join(" ");
  // Node sets an error when the command cannot start or runs out of time.
  if (run.error !== undefined) {
    return fail(`${name} failed. It reported: ${run.error.message}`);
  }
  if (run.status === null) {
    return fail(
      `${name} was ended by the signal ${String(run.signal)}. ${run.stderr}`,
    );
  }
  if (run.status !== 0 && !(options.answerCodes ?? []).includes(run.status)) {
    return fail(`${name} ended with code ${String(run.status)}. ${run.stderr}`);
  }
  return succeed({ code: run.status, stdout: run.stdout });
}
