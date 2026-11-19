import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { OtherQuoteTimes } from "./other-quote-times";

const sharedTime = new Date("2026-10-30T09:14:55.000Z");
const sharedMinute = new Date("2026-10-30T09:14:58.000Z");
const sameDay = new Date("2026-10-30T09:13:30.000Z");
const otherDay = new Date("2026-10-29T09:14:00.000Z");

const texts: Record<
  Locale,
  { one: string; several: string; sameDay: string; time: string }
> = {
  id: {
    one: "Waktu harga TLKM: 29 Okt 2026, 16.14 WIB",
    several: "Waktu harga BBCA dan TLKM: 29 Okt 2026, 16.14 WIB",
    sameDay: "Waktu harga ANTM: 16.13 WIB",
    time: "29 Okt 2026, 16.14 WIB",
  },
  en: {
    one: "Price time for TLKM: Oct 29, 2026, 4:14 PM WIB",
    several: "Price time for BBCA and TLKM: Oct 29, 2026, 4:14 PM WIB",
    sameDay: "Price time for ANTM: 4:13 PM WIB",
    time: "Oct 29, 2026, 4:14 PM WIB",
  },
};

for (const locale of locales) {
  test(`lists the prices whose time differs from the shared time, with the time of day on its date and the date on another day, and groups codes of one time in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const render = (quotes: { code: string; quotedAt: Date }[]) =>
      renderMarkupForTest(
        <OtherQuoteTimes quotes={quotes} sharedTime={sharedTime} />,
      );
    const renderText = (quotes: { code: string; quotedAt: Date }[]) =>
      renderTextMarkupForTest(
        <OtherQuoteTimes quotes={quotes} sharedTime={sharedTime} />,
      );
    expect(
      render([
        { code: "BBCA", quotedAt: sharedTime },
        { code: "TLKM", quotedAt: sharedMinute },
      ]),
    ).toBe("");
    expect(
      renderText([
        { code: "BBCA", quotedAt: sharedMinute },
        { code: "TLKM", quotedAt: otherDay },
      ]),
    ).toContain(markupTextForTest(texts[locale].one));
    const sameDayText = renderText([
      { code: "ANTM", quotedAt: sameDay },
      { code: "BBCA", quotedAt: sharedMinute },
    ]);
    expect(sameDayText).toContain(markupTextForTest(texts[locale].sameDay));
    const several = [
      { code: "BBCA", quotedAt: otherDay },
      { code: "TLKM", quotedAt: otherDay },
    ];
    const grouped = render(several);
    expect(renderText(several)).toContain(
      markupTextForTest(texts[locale].several),
    );
    expect(grouped).toContain(markupTextForTest(texts[locale].time));
    expect(grouped.split(markupTextForTest(texts[locale].time))).toHaveLength(
      2,
    );
  });
}
