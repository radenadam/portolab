import { parseOptionalText, checkMaximumLength } from "~/form-text";
import { getLocale } from "~/paraglide/runtime.js";
import { succeed } from "~/result";
import type { Result } from "~/result";
import type { GlossaryTerm } from "./content";
import { glossaryQueryMaximumLength } from "./glossary-query-maximum-length";

export function parseGlossaryQuery(
  value: unknown,
  source: string,
): Result<string, string> {
  const text = parseOptionalText(value, source);
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
