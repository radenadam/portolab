import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { languageNames } from "~/language-names";
import { orderLotsForTest } from "./orders-for-test";
import { activityOrderForTest } from "./activity-for-test";
import { HomeSinceCard } from "./home-since-card";

const texts: Record<
  Locale,
  {
    title: string;
    close: string;
    one: string;
    several: string;
    outcome: string;
  }
> = {
  id: {
    title: "Sejak kunjungan terakhir",
    close: "Tutup",
    one: "Beli 1 lot BBCA",
    several: "Beli 5 lot BBCA",
    outcome: "Kedaluwarsa 2 Nov 2026, 16.26 WIB tanpa tereksekusi.",
  },
  en: {
    title: "Since your last visit",
    close: "Close",
    one: "Buy 1 lot of BBCA",
    several: "Buy 5 lots of BBCA",
    outcome: "Expired Nov 2, 2026, 4:26 PM WIB without filling.",
  },
};
const classId = 1 as ClassId;
const now = new Date("2026-11-02T10:00:00Z");
for (const locale of locales) {
  test(`shows one and several lots in the home summary in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const count of [1, 5]) {
      const html = renderMarkupForTest(
        <HomeSinceCard
          classId={classId}
          now={now}
          orders={[
            activityOrderForTest(1, {
              lots: orderLotsForTest(count),
              state: {
                kind: "expired",
                expiredAt: new Date("2026-11-02T09:26:00Z"),
              },
            }),
          ]}
        />,
      );
      const text = html.replace(/<[^>]+>/g, "");
      expect(text).toContain(texts[locale].title);
      expect(text).toContain(texts[locale].close);
      expect(text).toContain(
        count === 1 ? texts[locale].one : texts[locale].several,
      );
      expect(text).toContain(markupTextForTest(texts[locale].outcome));
      expect(html).toContain('method="post"');
    }
    expect(
      renderMarkupForTest(
        <HomeSinceCard classId={classId} now={now} orders={[]} />,
      ),
    ).toBe("");
  });
}
