import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";

/** Reads the text of a field that a person must fill in, as the person typed it. The source is the label of the field, and the failure is a sentence for the reader in the current language. */
export function parseFilledText(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value === "string") {
    return value.trim() === ""
      ? fail(m.app_empty_field_error({ field: source }))
      : succeed(value);
  }
  // A form gives null for a field that it did not send, and only a forged form sends a file in a field of text.
  return fail(
    value === null || value === undefined
      ? m.app_empty_field_error({ field: source })
      : m.app_not_text_error({ field: source, type: typeName(value) }),
  );
}

/** Reads a short text that a person typed, such as a name, without the spaces around it and with each run of spaces inside it as one space. */
export function parseShortText(
  value: unknown,
  source: string,
  maximumLength: number,
): Result<string, string> {
  const text = parseFilledText(value, source);
  if (!text.ok) {
    return text;
  }
  const tidied = text.value.trim().replace(/\s+/g, " ").normalize("NFC");
  return checkMaximumLength(tidied, source, maximumLength);
}

/** Accepts a text of a field that has at most the maximum number of characters. */
export function checkMaximumLength(
  text: string,
  source: string,
  maximumLength: number,
): Result<string, string> {
  const length = characterCount(text);
  return length > maximumLength
    ? fail(
        m.app_too_long_error({
          field: source,
          maximum: formatNumber(maximumLength),
          length: formatNumber(length),
        }),
      )
    : succeed(text);
}

/** Counts the characters of a text as a reader counts them. A letter outside the basic plane of Unicode takes two units of a JavaScript string, but it is one character. */
export function characterCount(text: string): number {
  return Array.from(text).length;
}
