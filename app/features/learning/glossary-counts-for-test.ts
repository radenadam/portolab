import { numberFormat } from "../../intl-formats.ts";
import { intlLocale } from "../../intl-locale.ts";
import type { Locale } from "../../paraglide/runtime.js";

export const glossaryTermCountForTest = 45;

export const glossaryCountTextsForTest: Record<
  Locale,
  { none: string; one: string; all: string }
> = {
  id: {
    none: "0 istilah",
    one: "1 istilah",
    all: `${numberFormat(intlLocale("id"), {}).format(glossaryTermCountForTest)} istilah`,
  },
  en: {
    none: "0 terms",
    one: "1 term",
    all: `${numberFormat(intlLocale("en"), {}).format(glossaryTermCountForTest)} terms`,
  },
};
