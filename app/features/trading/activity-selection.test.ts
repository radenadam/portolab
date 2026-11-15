import { activityFilters } from "./activity-options";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import {
  activityStatus,
  parseActivityFilter,
  parseActivityView,
} from "./activity-selection";
import { activityNowForTest, activityOrderForTest } from "./activity-for-test";

test("parses each status and phone view, defaults missing choices, and rejects other input", () => {
  for (const filter of activityFilters)
    expect(parseActivityFilter(filter, "status")).toEqual({
      ok: true,
      value: filter,
    });
  expect(parseActivityFilter(null, "status")).toEqual({
    ok: true,
    value: "all",
  });
  expect(parseActivityView(null, "view")).toEqual({
    ok: true,
    value: "orders",
  });
  for (const view of ["orders", "journal"])
    expect(parseActivityView(view, "view")).toEqual({ ok: true, value: view });
  for (const value of ["unknown", "x".repeat(100_000), 1, {}, undefined]) {
    expect(parseActivityFilter(value, "status").ok).toBe(false);
    expect(parseActivityView(value, "view").ok).toBe(false);
  }
});

const longText: Record<Locale, readonly [string, string]> = {
  id: [
    'Kolom "choice" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    'Kolom "choice" berisi 800.000 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
  ],
  en: [
    'The field "choice" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
    'The field "choice" has 800,000 characters, more than this field takes. Fill it in with the text that it asks for.',
  ],
};
for (const locale of locales) {
  test(`bounds query choices before describing input beyond the field limit in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const parse of [parseActivityFilter, parseActivityView]) {
      const atLimit = parse("x".repeat(fieldMaximumLength), "choice");
      expect(atLimit.ok).toBe(false);
      if (!atLimit.ok)
        expect(atLimit.failure).toContain("x".repeat(fieldMaximumLength));
      for (const index of [0, 1] as const) {
        const length = (
          [fieldMaximumLength + 1, fieldMaximumLength * 100] as const
        )[index];
        expect(parse("x".repeat(length), "choice")).toEqual({
          ok: false,
          failure: longText[locale][index],
        });
      }
    }
  });
}

test("groups waiting and resting together and derives expiry at its exact moment", () => {
  for (const kind of ["waiting", "resting"] as const) {
    const order = activityOrderForTest(1, { state: { kind } });
    expect(activityStatus(order, activityNowForTest)).toBe("waiting");
    expect(activityStatus(order, new Date(order.expiresAt.getTime() - 1))).toBe(
      "waiting",
    );
    expect(activityStatus(order, order.expiresAt)).toBe("expired");
  }
});
