import { onTestFinished } from "vitest";
import { getLocale, overwriteGetLocale } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";

/** Shows the text of the app in a language until the test finishes. */
export function switchLocaleForTest(locale: Locale): void {
  const previousGetLocale = getLocale;
  overwriteGetLocale(() => locale);
  onTestFinished(() => {
    overwriteGetLocale(previousGetLocale);
  });
}
