import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { SimulationBadge } from "./simulation-badge";

const texts: Record<
  Locale,
  { long: string; short: string; title: string; name: string; lesson: string }
> = {
  id: {
    long: "Simulasi · harga tertunda ±10 mnt",
    short: "Simulasi · ±10 mnt",
    title: "Simulasi dan harga tertunda",
    name: "Simulasi",
    lesson:
      "Pelajari lebih lanjut di sesi 6. Pelajaran belum tersedia di Portolab.",
  },
  en: {
    long: "Simulation · prices delayed ±10 min",
    short: "Simulation · ±10 min",
    title: "Simulation and delayed prices",
    name: "Simulation",
    lesson:
      "Learn more in session 6. The lesson is not available in Portolab yet.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`labels every result as a simulation with the delay, long on a desktop and short on a phone, and opens the card with its paragraphs, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderMarkupForTest(
        <SimulationBadge
          badge={{ delayMinutes: 10, card: ["The first.", "The second."] }}
        />,
      ),
    ).toBe(
      [
        `<button type="button" popoverTarget="simulation-card" style="anchor-name:--simulation-card"><span></span><span>${text.long}</span><span>${text.short}</span><span aria-hidden="true">?</span></button>`,
        `<div id="simulation-card" popover="auto" role="dialog" aria-label="${text.title}" style="position-anchor:--simulation-card"><div><p>${text.title}</p><p>The first.</p><p>The second.</p><p>${text.lesson}</p></div></div>`,
      ].join(""),
    );
  });

  test(`labels a page without the data of the frame as a simulation alone, without a card, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(renderMarkupForTest(<SimulationBadge badge={undefined} />)).toBe(
      `<span><span></span>${text.name}</span>`,
    );
  });
}
