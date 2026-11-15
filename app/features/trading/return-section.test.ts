import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { historyEndText, missingCalendarText } from "./return-section";
import type { PortfolioReader } from "./text-for-reader";
const texts: Record<
  Locale,
  Record<"pending" | "several" | "owner" | "lecturer", string>
> = {
  id: {
    pending:
      "Harga tanggal 4 November 2026 menjadi final pada pukul 16.26 WIB, dan Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan hari itu atau hari sesudahnya.",
    several:
      "Portolab belum menyimpan harga penutupan BBCA dan TLKM pada 4 November 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan masing-masing pada hari itu atau hari sesudahnya.",
    owner:
      "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu dosen Anda agar kalender tersebut dapat ditambahkan.",
    lecturer:
      "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu orang yang menjalankan server Portolab ini agar kalender tersebut dapat ditambahkan.",
  },
  en: {
    pending:
      "The prices of November 4, 2026 become final at 4:26 PM WIB, and Portolab shows the returns from that day on once an update of the price history stores closes of that day or of a later day.",
    several:
      "Portolab has not stored the closes of BBCA and TLKM on November 4, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of each of them on that day or on a later day.",
    owner:
      "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell your lecturer, so that the calendar can be added.",
    lecturer:
      "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell the person who runs this Portolab server, so that the calendar can be added.",
  },
};
for (const locale of locales) {
  test(`names the finalization, missing closes, and calendar step for each reader in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const reader of [
      { kind: "owner", classId: 7 as ClassId },
      { kind: "lecturer", studentName: "Raka" },
    ] as const satisfies readonly PortfolioReader[]) {
      expect(
        historyEndText(
          {
            kind: "notFinal",
            date: "2026-11-04",
            finalAt: new Date("2026-11-04T09:26:00Z"),
          },
          reader,
        ),
      ).toBe(texts[locale].pending);
      expect(
        historyEndText(
          {
            kind: "missingCloses",
            date: "2026-11-04",
            codes: ["BBCA", "TLKM"],
          },
          reader,
        ),
      ).toBe(texts[locale].several);
      expect(historyEndText({ kind: "missingCalendar" }, reader)).toBe(
        texts[locale][reader.kind],
      );
      expect(missingCalendarText(reader)).toBe(texts[locale][reader.kind]);
    }
  });
}
