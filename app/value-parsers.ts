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

/** Reads the number that identifies a row of a table, such as a class in the address of its page, which is a positive whole number. The caller names the type of the id. */
export function parseRecordId<Id extends number>(
  value: unknown,
  source: string,
): Result<Id, string> {
  if (typeof value === "string" && /^[1-9][0-9]{0,15}$/.test(value)) {
    const id = Number(value);
    if (Number.isSafeInteger(id)) {
      // Every positive whole number can identify a row, so the number is an id of any table.
      return succeed(id as Id);
    }
  }
  return fail(
    `${source} must be a positive whole number, but it is ${describeValue(value)}.`,
  );
}
