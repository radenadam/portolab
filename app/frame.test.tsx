import { expect, test } from "vitest";
import {
  delayNoticeText,
  Frame,
  PageColumns,
  PageHeader,
  PhoneAndDesktop,
} from "./frame";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { renderInRouterForTest } from "./render-in-router-for-test";
import { switchLocaleForTest } from "./switch-locale-for-test";

// 16:14 WIB on Friday 30 October 2026, when the fixture source quoted its latest prices.
const quotedAt = new Date("2026-10-30T09:14:00Z");

const texts: Record<
  Locale,
  {
    navigation: string;
    simulation: string;
    delay: string;
    delayWithoutPrices: string;
    pricesTime: string;
  }
> = {
  id: {
    navigation: "Navigasi utama",
    simulation: "Simulasi",
    delay:
      "Harga tertunda sekitar 10 menit. Harga terakhir tercatat pada 30 Okt 2026, 16.14 WIB.",
    delayWithoutPrices: "Harga tertunda sekitar 10 menit.",
    pricesTime: "30 Okt 2026, 16.14 WIB",
  },
  en: {
    navigation: "Main navigation",
    simulation: "Simulation",
    delay:
      "Prices are delayed by about 10 minutes. The latest price was quoted at Oct 30, 2026, 4:14 PM WIB.",
    delayWithoutPrices: "Prices are delayed by about 10 minutes.",
    pricesTime: "Oct 30, 2026, 4:14 PM WIB",
  },
};

// The names of the classes of CSS modules carry a hash, so a test finds a class by its name inside the hash.
function withoutClasses(html: string): string {
  return html.replaceAll(/ class="[^"]*"/g, "");
}

const links = [
  { path: "/classes/7/portfolio", label: "Portofolio", isCurrent: true },
  { path: "/prices", label: "Harga", isCurrent: false },
];

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`gives the delay of prices with the time of the latest price, or the delay alone before the first price, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(delayNoticeText(10, quotedAt)).toBe(text.delay);
    expect(delayNoticeText(10, undefined)).toBe(text.delayWithoutPrices);
  });

  test(`frames a page with the mark, the navigation with its current page, the tools, the mark of a simulation, the delay, and the main landmark, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = withoutClasses(
      renderInRouterForTest(
        <Frame
          navigation={links}
          backLink={undefined}
          tools={<span>tools</span>}
          delayNotice={text.delay}
          showsDelayOnPhone
        >
          <p>page</p>
        </Frame>,
      ),
    );
    for (const part of [
      '<a href="/" data-discover="true">Portolab</a>',
      `<nav aria-label="${text.navigation}"><ul><li><a aria-current="page" href="/classes/7/portfolio" data-discover="true">Portofolio</a></li><li><a href="/prices" data-discover="true">Harga</a></li></ul></nav>`,
      `<div><span>tools</span></div><p>${text.simulation}</p><p>${text.delay}</p>`,
      "<main><p>page</p></main>",
    ]) {
      expect(html).toContain(part);
    }
  });

  test(`opens a page with its path, its heading, and the time of its prices, or without a time for a page without prices, in ${language}`, () => {
    switchLocaleForTest(locale);
    const path = [{ label: "Manajemen Portofolio", path: "/classes/7" }];
    expect(
      withoutClasses(
        renderInRouterForTest(
          <PageHeader
            path={path}
            title="Portofolio Anda"
            pricesAt={quotedAt}
          />,
        ),
      ),
    ).toBe(
      `<div><div><span><a href="/classes/7" data-discover="true">Manajemen Portofolio</a><span aria-hidden="true">/</span></span><h1>Portofolio Anda</h1></div><p>${text.pricesTime}</p></div>`,
    );
    expect(
      renderInRouterForTest(
        <PageHeader path={path} title="Portofolio Anda" pricesAt={undefined} />,
      ),
    ).not.toContain("<p");
  });
}

test("shows the link back to the page above in place of the mark on a phone, under a name that says that it leads back", () => {
  const html = renderInRouterForTest(
    <Frame
      navigation={links}
      backLink={{
        path: "/classes/7/portfolio",
        label: "Portofolio",
        name: "Kembali ke Portofolio",
      }}
      tools={undefined}
      delayNotice={undefined}
      showsDelayOnPhone
    >
      <p>page</p>
    </Frame>,
  );
  expect(html).toMatch(/<a class="[^"]*_markBesideBack_[^"]*" href="\/"/);
  expect(withoutClasses(html)).toContain(
    '<a aria-label="Kembali ke Portofolio" href="/classes/7/portfolio" data-discover="true"><span aria-hidden="true">←</span>Portofolio</a>',
  );
});

test("leaves the delay out of a phone on a page whose first part gives it, and out of every screen without the data of the root", () => {
  const frame = (
    delayNotice: string | undefined,
    showsDelayOnPhone: boolean,
  ): string =>
    renderInRouterForTest(
      <Frame
        navigation={links}
        backLink={undefined}
        tools={undefined}
        delayNotice={delayNotice}
        showsDelayOnPhone={showsDelayOnPhone}
      >
        <p>page</p>
      </Frame>,
    );
  expect(frame("The delay.", false)).toMatch(
    /<p class="[^"]*_delayOnDesktop_[^"]*">The delay.<\/p>/,
  );
  expect(frame("The delay.", true)).not.toContain("_delayOnDesktop_");
  expect(frame(undefined, true)).not.toContain("_delay_");
});

test("places the right column under the header line or leaves it to a wide screen, with the main column after the header line", () => {
  const columns = (narrowPlacement: "first" | "hidden"): string =>
    renderInRouterForTest(
      <PageColumns
        header={<p>header</p>}
        main={<p>main</p>}
        aside={<p>aside</p>}
        narrowPlacement={narrowPlacement}
      />,
    );
  expect(withoutClasses(columns("first"))).toBe(
    "<div><p>header</p><div><p>aside</p></div><div><p>main</p></div></div>",
  );
  expect(withoutClasses(columns("hidden"))).toBe(
    "<div><p>header</p><div><p>main</p></div><div><p>aside</p></div></div>",
  );
  expect(columns("hidden")).toMatch(/_asideOnWide_[^"]*"><p>aside/);
  expect(columns("first")).not.toContain("_asideOnWide_");
});

test("gives a part its form for a phone and its form for a desktop, each for its own screen", () => {
  const html = renderInRouterForTest(
    <PhoneAndDesktop phone={<p>rows</p>} desktop={<p>table</p>} />,
  );
  expect(html).toMatch(
    /_onPhone_[^"]*"><p>rows<\/p><\/div><div class="[^"]*_onDesktop_[^"]*"><p>table<\/p>/,
  );
});
