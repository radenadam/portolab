import { characterCount } from "./character-count.ts";
import { fieldMaximumLength } from "./form-size.ts";
import { fail, succeed } from "./result.ts";
import type { Result } from "./result.ts";

/** Accepts the text of a field of a form or of an address, as sent with the spaces around it, when it has at most fieldMaximumLength characters, and otherwise fails with its number of characters. A parser calls it before any other work on the text, such as trimming, normalizing, hashing, parsing, or quoting it, because that work grows with the length of the text. */
export function checkFieldLength(text: string): Result<string, number> {
  const length = characterCount(text);
  return length > fieldMaximumLength ? fail(length) : succeed(text);
}
