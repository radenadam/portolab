import { getLocale } from "./paraglide/runtime.js";

const intlLocales = { id: "id-ID", en: "en-US" } as const;

export function intlLocale(): string {
  return intlLocales[getLocale()];
}
