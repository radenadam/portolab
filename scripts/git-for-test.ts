import { successValueForTest } from "../app/success-value-for-test.ts";
import { runCommand } from "./run-command.ts";
import type { CommandOutput } from "./run-command.ts";

export function gitForTest(
  repository: string,
  commandArguments: readonly string[],
  answerCodes: readonly number[] = [],
): CommandOutput {
  return successValueForTest(
    runCommand(
      "git",
      [
        "-c",
        "user.name=Test",
        "-c",
        "user.email=test@example.com",
        "-c",
        "core.autocrlf=false",
        ...commandArguments,
      ],
      { cwd: repository, answerCodes },
    ),
    `git ${commandArguments.join(" ")}`,
  );
}
