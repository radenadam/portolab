import { formatList } from "~/formatting";
import { languageNames } from "~/language-names";
import { m } from "~/paraglide/messages.js";
import { isLocale, locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";

/** Reads the language that the language switch sent. The failure is a message for the reader in the current language. */
export function parseLocale(
  value: unknown,
  source: string,
): Result<Locale, string> {
  if (isLocale(value)) {
    return succeed(value);
  }
  // The messages name every language that Portolab offers, so a new language reaches them by itself.
  const names = locales.map((locale) => languageNames[locale]);
  if (typeof value === "string") {
    return fail(
      m.language_unknown_error({
        field: source,
        value,
        languages: formatList(names, "conjunction"),
      }),
    );
  }
  const languages = formatList(names, "disjunction");
  return fail(
    value === null || value === undefined
      ? m.language_missing_error({ field: source, languages })
      : m.language_not_text_error({
          field: source,
          type: typeName(value),
          languages,
        }),
  );
}
