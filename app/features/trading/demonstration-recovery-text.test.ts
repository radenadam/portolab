import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { measureFailureText } from "~/features/measures/measure-failure-text";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { dayChangeFailureText } from "./day-change-failure-text";
import { missingCalendarText } from "./return-section";

const texts: Record<
  Locale,
  { calendar: string; daily: string; reference: string; rate: string }
> = {
  id: {
    calendar:
      "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu orang yang menjalankan server Portolab ini agar kalender tersebut dapat ditambahkan.",
    daily:
      "Perubahan harian belum tersedia karena kalender perdagangan pembanding belum tercatat. Beri tahu orang yang menjalankan server Portolab ini agar kalender tersebut dapat ditambahkan.",
    reference:
      "Nilai portofolio pada penutupan 2 November 2026 adalah -Rp 3.229.000, sedangkan perubahan persentase memerlukan nilai pembanding di atas nol. Beri tahu orang yang menjalankan server Portolab ini agar catatan portofolio dapat diperiksa.",
    rate: "BI-Rate pada atau sebelum 31 Oktober 2026, akhir bulan terakhir dari imbal hasil tersebut, belum tercatat di Portolab, sehingga ukurannya belum memiliki suku bunga bebas risiko. Beri tahu orang yang menjalankan server Portolab ini agar BI-Rate hari itu dapat ditambahkan.",
  },
  en: {
    calendar:
      "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell the person who runs this Portolab server, so that the calendar can be added.",
    daily:
      "The daily change is unavailable because the comparison trading calendar is not recorded. Tell the person who runs this Portolab server, so that the calendar can be added.",
    reference:
      "The portfolio value at the close of November 2, 2026 is -IDR 3,229,000, but a percentage change needs a comparison value above zero. Tell the person who runs this Portolab server, so that the portfolio records can be checked.",
    rate: "Portolab has not recorded a BI-Rate on or before October 31, 2026, the end of the last month of the returns, so the measures have no risk-free rate. Tell the person who runs this Portolab server, so that the BI-Rate of that day can be added.",
  },
};

for (const locale of locales) {
  test(`gives the lecturer the recovery step for missing demonstration data in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const reader = {
      kind: "owner",
      classId: 1 as ClassId,
      portfolioKind: "demonstration",
    } as const;
    expect(missingCalendarText(reader)).toBe(texts[locale].calendar);
    expect(dayChangeFailureText({ kind: "missingCalendar" }, reader)).toBe(
      texts[locale].daily,
    );
    expect(
      dayChangeFailureText(
        {
          kind: "nonPositiveReference",
          date: "2026-11-02",
          value: rupiah(-3_229_000),
        },
        reader,
      ),
    ).toBe(texts[locale].reference);
    for (const subject of [
      { kind: "stock", code: "BBCA", reader },
      { kind: "market", reader },
      { kind: "correlation", reader },
    ] as const) {
      expect(
        measureFailureText(
          { kind: "noRiskFreeRate", date: "2026-10-31" },
          subject,
        ),
      ).toBe(texts[locale].rate);
    }
    expect(
      measureFailureText(
        { kind: "noRiskFreeRate", date: "2026-10-31" },
        { kind: "portfolio", reader },
      ),
    ).toBe(texts[locale].rate);
  });
}
