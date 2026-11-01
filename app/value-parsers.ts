import { fail, succeed } from "./result.ts";
import type { Result } from "./result.ts";
import { listOfWords } from "./sentences.ts";
import { describeValue } from "./value-shapes.ts";

/** Reads one of a fixed set of names, such as the mode of the server or the source of prices. */
export function parseChoice<Choice extends string>(
  value: unknown,
  source: string,
  choices: readonly Choice[],
): Result<Choice, string> {
  const choice = choices.find((candidate) => candidate === value);
  if (choice !== undefined) {
    return succeed(choice);
  }
  return fail(
    `${source} must be ${describeChoices(choices)}, but it is ${describeValue(value)}.`,
  );
}

/** Names a fixed set of names as a choice in a failure text, such as "yahoo" or "fixture". */
export function describeChoices(choices: readonly string[]): string {
  const quotedChoices = choices.map((candidate) => `"${candidate}"`);
  return listOfWords(quotedChoices, "disjunction");
}

/** Reads the path of a file, such as a command-line argument or the place of the database. */
export function parseFilePath(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value === "string" && value !== "") {
    return succeed(value);
  }
  return fail(
    `${source} must be the path of a file, but it is ${describeValue(value)}.`,
  );
}
