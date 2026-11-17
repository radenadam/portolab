import { expect, test } from "@playwright/test";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { tradeImpactStudent } from "./trade-impact-student.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";

const texts: Record<Locale, { body: string; time: string }> = {
  id: {
    body: "Waktu harga BBCA dan TLKM: 30 Okt 2026, 16.14 WIB",
    time: "30 Okt 2026, 16.14 WIB",
  },
  en: {
    body: "Price time for BBCA and TLKM: Oct 30, 2026, 4:14 PM WIB",
    time: "Oct 30, 2026, 4:14 PM WIB",
  },
};

for (const javaScriptEnabled of [true, false]) {
  test.describe(`impact quote times with JavaScript ${String(javaScriptEnabled)}`, () => {
    test.use({ javaScriptEnabled });
    for (const locale of locales) {
      test(`shows portfolio quote times that differ from the ticket in ${languageNames[locale]}`, async ({
        page,
        browser,
      }) => {
        const { student, classPath } = await tradeImpactStudent(page, browser, {
          locale,
          kind: "diversified",
        });
        await student.goto(`${classPath}/stocks/BBCA/buy?lots=10`);
        await expect(
          student.getByText(texts[locale].body, { exact: true }),
        ).toHaveCount(0);
        await student.goto(`${classPath}/stocks/BMRI/buy?lots=10`);
        // The header of the stock states the times beside the docked ticket of a desktop, and the sheet of a phone states them itself.
        const inTicket = student
          .locator("dialog")
          .getByText(texts[locale].body, { exact: true });
        const notice =
          test.info().project.name === "desktop"
            ? student.getByText(texts[locale].body, { exact: true }).first()
            : inTicket;
        await expect(notice).toBeVisible();
        if (test.info().project.name === "desktop")
          await expect(inTicket).toBeHidden();
        await expect(notice.locator("[data-number]")).toHaveText(
          texts[locale].time,
        );
        expect(await layoutProblems(student)).toEqual([]);
        if (javaScriptEnabled) await expectAccessibleScreen(student);
        await student.context().close();
      });
    }
  });
}
