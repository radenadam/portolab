import { getLocale } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";

const intlLocales = { id: "id-ID", en: "en-US" } as const;

export function intlLocale(locale: Locale = getLocale()): string {
  return intlLocales[locale];
}
