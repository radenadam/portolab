import { m } from "~/paraglide/messages.js";
import { isLocale } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";

/** Reads the language that the language switch sent. The failure is a message for the reader in the current language. */
export function parseLocale(
  value: unknown,
  source: string,
): Result<Locale, string> {
  if (isLocale(value)) {
    return succeed(value);
  }
  return fail(
    typeof value === "string"
      ? m.language_unknown({ field: source, value })
      : m.language_missing({ field: source }),
  );
}
