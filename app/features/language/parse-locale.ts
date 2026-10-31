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
  if (typeof value === "string") {
    return fail(m.language_unknown_error({ field: source, value }));
  }
  return fail(
    value === null || value === undefined
      ? m.language_missing_error({ field: source })
      : m.language_not_text_error({ field: source }),
  );
}
