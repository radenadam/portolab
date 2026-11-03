import { parseFilledText } from "~/form-text";
import { formatList, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { isReadableText, lookalikeCharacters } from "~/random-text.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { joinCodeLength } from "./join-code";
import type { JoinCode } from "./join-code";

// The letters and digits of a code have one gap fewer than their number, and the field takes a space or a hyphen in each gap, which covers every way that a person copies a code.
const typedCodeMaximumLength = joinCodeLength + (joinCodeLength - 1);

/** Reads the code of a class as a person typed it. A code ignores case, spaces, and hyphens, because a person copies it from a projector or a chat. */
export function parseJoinCode(
  value: unknown,
  source: string,
): Result<JoinCode, string> {
  const text = parseFilledText(value, source, typedCodeMaximumLength);
  if (!text.ok) {
    return text;
  }
  const code = text.value.toLowerCase().replaceAll(/[\s-]/g, "");
  return isJoinCode(code)
    ? succeed(code)
    : fail(
        m.classes_malformed_code_error({
          field: source,
          code: text.value.trim(),
          length: formatNumber(joinCodeLength),
          lookalikes: formatList(
            lookalikeCharacters().map((character) => `"${character}"`),
            "disjunction",
          ),
        }),
      );
}

function isJoinCode(text: string): text is JoinCode {
  return text.length === joinCodeLength && isReadableText(text);
}
