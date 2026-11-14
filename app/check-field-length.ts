import { characterCount } from "./character-count.ts";
import { fieldMaximumLength } from "./form-size.ts";
import { fail, succeed } from "./result.ts";
import type { Result } from "./result.ts";

/** A parser bounds text before trimming, normalizing, hashing, parsing, or quoting it, because that work grows with its length. An address can need a larger bound because it holds an encoded field. */
export function checkFieldLength(
  text: string,
  maximumLength = fieldMaximumLength,
): Result<string, number> {
  const length = characterCount(text);
  return length > maximumLength ? fail(length) : succeed(text);
}
