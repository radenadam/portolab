import { checkFieldLengthForReader, checkMaximumLength } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { getLocale } from "~/paraglide/runtime.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";
import type { GlossaryTerm } from "./content";
import { glossaryQueryMaximumLength } from "./glossary-query-maximum-length";

export function parseGlossaryQuery(
  value: unknown,
  source: string,
): Result<string, string> {
  if (value === null) return succeed("");
  if (typeof value !== "string")
    return fail(m.app_not_text_error({ field: source, type: typeName(value) }));
  const text = checkFieldLengthForReader(value, source);
  if (!text.ok) return text;
  const bounded = checkMaximumLength(
    text.value,
    source,
    glossaryQueryMaximumLength,
  );
  return bounded.ok ? succeed(bounded.value.trim()) : bounded;
}

export function searchGlossary(
  terms: readonly GlossaryTerm[],
  query: string,
): GlossaryTerm[] {
  const locale = getLocale();
  const needle = query.toLocaleLowerCase(locale);
  const collator = new Intl.Collator(locale);
  return terms
    .filter((term) =>
      [
        term.title,
        ...term.blocks.flatMap((block) =>
          block.kind === "paragraph" ? [block.text] : [],
        ),
      ].some((text) => text.toLocaleLowerCase(locale).includes(needle)),
    )
    .sort((first, second) => collator.compare(first.title, second.title));
}
