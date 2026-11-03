import { characterCount } from "./character-count.ts";
import { fieldMaximumLength } from "./form-size.ts";
import { fail, succeed } from "./result.ts";
import type { Result } from "./result.ts";

/** Accepts the text of a field of a form or of an address, as sent with the spaces around it, when it has at most fieldMaximumLength characters, and otherwise fails with its number of characters. A parser calls it before any other work on the text, such as trimming, normalizing, hashing, parsing, or quoting it, because that work grows with the length of the text. */
export function checkFieldLength(text: string): Result<string, number> {
  const length = characterCount(text);
  return length > fieldMaximumLength ? fail(length) : succeed(text);
}

/** The failure text of a parser for the log or for another program, when its value is longer than fieldMaximumLength. It starts with what the source must be, such as "classId must be a positive whole number", and states the length of the value instead of quoting it. The rule of each field allows far less, so it states no maximum, which would not be the one of the field. */
export function fieldLengthFailure(
  expectation: string,
  length: number,
): string {
  return `${expectation}, but it has ${String(length)} characters, far more than any field takes.`;
}
