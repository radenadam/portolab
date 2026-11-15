import { expect, test } from "vitest";
import { formatSignedPercent } from "~/formatting";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import { layoutTimeChart } from "./time-chart-layout";
import type { TimeLine } from "./time-chart-layout";
import { timeEndLabels } from "./time-end-labels";

const texts: Record<Locale, { name: string; labels: readonly string[] }> = {
  id: { name: "Anda", labels: ["Anda +1,00%", "IHSG +1,00%"] },
  en: { name: "You", labels: ["You +1.00%", "IHSG +1.00%"] },
};

for (const locale of locales) {
  test(`keeps the last values of equal lines apart in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const latest = { date: "2026-10-30", value: cumulativeReturn(0.01) };
    const lines: TimeLine<typeof latest>[] = [
      {
        name: texts[locale].name,
        endName: texts[locale].name,
        kind: "own",
        valueOf: (point) => point.value,
      },
      {
        name: "IHSG",
        endName: "IHSG",
        kind: "reference",
        valueOf: (point) => point.value,
      },
    ];
    const labels = timeEndLabels(lines, {
      latest,
      layout: layoutTimeChart(
        [latest.date],
        lines.map((line) => ({ kind: line.kind, values: [latest.value] })),
      ),
      valueText: (value) => formatSignedPercent(value).text,
    });
    expect(labels.map((label) => label.text)).toEqual(texts[locale].labels);
    expect(labels.map((label) => label.dy)).toEqual(["-0.4em", "1.1em"]);
  });
}
