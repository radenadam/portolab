import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { formatNumber } from "~/formatting";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { onboardingSteps } from "./onboarding";
import { parseOnboardingStep } from "./parse-onboarding-step";

test("opens only the named introduction steps and keeps an absent step closed", () => {
  expect(parseOnboardingStep(null, "welcome")).toEqual({
    ok: true,
    value: undefined,
  });
  for (const step of onboardingSteps)
    expect(parseOnboardingStep(step, "welcome")).toEqual({
      ok: true,
      value: step,
    });
  expect(parseOnboardingStep("unknown", "welcome")).toEqual({
    ok: false,
    failure:
      'welcome must be "cash", "impact", or "help", but it is "unknown".',
  });
});

const lengthFailures: Record<Locale, (length: string) => string> = {
  id: (length) =>
    `Kolom "welcome" berisi ${length} karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.`,
  en: (length) =>
    `The field "welcome" has ${length} characters, more than this field takes. Fill it in with the text that it asks for.`,
};

for (const locale of locales)
  test(`bounds an introduction address before quoting its value in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const bounded = "x".repeat(fieldMaximumLength);
    expect(parseOnboardingStep(bounded, "welcome")).toEqual({
      ok: false,
      failure: `welcome must be "cash", "impact", or "help", but it is "${bounded}".`,
    });
    for (const length of [fieldMaximumLength + 1, 1_000_000]) {
      expect(parseOnboardingStep("x".repeat(length), "welcome")).toEqual({
        ok: false,
        failure: lengthFailures[locale](formatNumber(length)),
      });
    }
  });
