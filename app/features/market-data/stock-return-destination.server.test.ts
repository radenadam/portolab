import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { stockReturnDestination } from "./stock-return-destination.server";

const labels: Record<Locale, readonly string[]> = {
  id: [
    "Kembali ke Ringkasan mahasiswa",
    "Kembali ke Analisis mahasiswa",
    "Kembali ke Jurnal dan order mahasiswa",
  ],
  en: [
    "Back to student Summary",
    "Back to student Analysis",
    "Back to student Journal and orders",
  ],
};

for (const locale of locales) {
  test(`keeps each taught-student tab, query, and row for lecturers in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const origin = "https://portolab.example";
    const request = new Request(`${origin}/classes/7/stocks/BBCA`);
    for (const [index, suffix] of ["", "/analysis", "/journal"].entries()) {
      const returnTo = `/classes/7/students/9${suffix}?axis=risk&view=orders&status=rejected&returnTo=%2Fclasses%2F7%2Fstudents%3Fstudent%3D9%26measure%3Dtreynor#stock-BBCA`;
      const url = new URL(request.url);
      url.searchParams.set("returnTo", returnTo);
      expect(
        stockReturnDestination({
          classId: 7 as ClassId,
          role: "lecturer",
          url,
          request,
        }),
      ).toEqual({
        returnTo,
        returnPath: returnTo,
        returnLabel: labels[locale][index],
      });
      expect(
        stockReturnDestination({
          classId: 7 as ClassId,
          role: "student",
          url,
          request,
        }).returnTo,
      ).toBeUndefined();
    }
    for (const returnTo of [
      "/classes/8/students/9",
      "/classes/7/students/0",
      "/classes/7/students/09/analysis",
      "/classes/7/students/9/other",
      "/classes/7/students/999999999999999999999",
    ]) {
      const url = new URL(request.url);
      url.searchParams.set("returnTo", returnTo);
      expect(
        stockReturnDestination({
          classId: 7 as ClassId,
          role: "lecturer",
          url,
          request,
        }).returnPath,
      ).toBe("/classes/7/market");
    }
  });
}
