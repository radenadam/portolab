import { expect, test } from "vitest";
import { AppIcon } from "./app-icon";
import { Frame, PageColumns, PageHeader, PhoneAndDesktop } from "./frame";
import type { FrameProfile } from "./frame";
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
    skip: string;
    navigation: string;
    profile: string;
    profileTitle: string;
    pricesTime: string;
  }
> = {
  id: {
    skip: "Lewati ke konten",
    navigation: "Navigasi utama",
    profile: "Profil Sari Wulandari",
    profileTitle: "Profil",
    pricesTime: "30 Okt 2026, 16.14 WIB",
  },
  en: {
    skip: "Skip to content",
    navigation: "Main navigation",
    profile: "Profile of Sari Wulandari",
    profileTitle: "Profile",
    pricesTime: "Oct 30, 2026, 4:14 PM WIB",
  },
};

// The names of the classes of CSS modules carry a hash, so a test finds a class by its name inside the hash.
function withoutClasses(html: string): string {
  return html.replaceAll(/ class="[^"]*"/g, "");
}

// The icon of an item is a path of its own, which the test leaves out to read the items.
function withoutIcons(html: string): string {
  return html.replaceAll(/<svg viewBox="0 0 24 24".*?<\/svg>/g, "");
}

const items = [
  {
    path: "/classes/7/portfolio",
    label: "Beranda",
    icon: "map",
    isCurrent: true,
  },
  {
    path: "/classes/7/market",
    label: "Pasar",
    icon: "trend",
    isCurrent: false,
  },
] as const;

const profile: FrameProfile = {
  name: "Sari Wulandari",
  menu: <span>menu</span>,
};

function frameForTest({
  frameItems,
  start,
  frameProfile,
}: {
  frameItems: readonly (typeof items)[number][];
  start: string | undefined;
  frameProfile: FrameProfile | undefined;
}): string {
  return withoutIcons(
    withoutClasses(
      renderInRouterForTest(
        <Frame
          items={frameItems}
          start={start === undefined ? undefined : <span>{start}</span>}
          profile={frameProfile}
          tools={<span>tools</span>}
          badge={<span>badge</span>}
        >
          <p>page</p>
        </Frame>,
      ),
    ),
  );
}

const itemList =
  '<ul><li><a aria-current="page" href="/classes/7/portfolio" data-discover="true">Beranda</a></li><li><a href="/classes/7/market" data-discover="true">Pasar</a></li></ul>';

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`frames a page with the link that skips to the content, the rail with the app icon, the items, and the avatar of the profile, the top bar with its start, the tools, the name, the badge, and the avatar of a phone, the content in the middle, and the tab bar, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = frameForTest({
      frameItems: items,
      start: "switcher",
      frameProfile: profile,
    });
    const icon = withoutClasses(renderInRouterForTest(<AppIcon />));
    const profileButton = (popover: string, content: string): string =>
      `<button type="button" popoverTarget="${popover}" aria-label="${text.profile}" style="anchor-name:--${popover}">${content}</button>`;
    const profilePopover = (popover: string): string =>
      `<div id="${popover}" popover="auto" role="dialog" aria-label="${text.profileTitle}" style="position-anchor:--${popover}"><span>menu</span></div>`;
    expect(html).toBe(
      [
        `<a href="#main">${text.skip}</a><div>`,
        `<nav aria-label="${text.navigation}"><a aria-label="Portolab" href="/" data-discover="true">${icon}</a>${itemList}`,
        `<div>${profileButton("rail-profile", '<span data-initials="SW"></span>')}${profilePopover("rail-profile")}</div></nav>`,
        `<div><header><div data-layout="content"><span>switcher</span><div><span>tools</span>`,
        `<span>${profileButton("top-profile", "<span>Sari Wulandari</span>")}</span><span>badge</span>`,
        `${profileButton("top-profile", '<span data-initials="SW"></span>')}${profilePopover("top-profile")}</div></div></header>`,
        `<main id="main" tabindex="-1"><div data-layout="content"><p>page</p></div></main></div>`,
        `<nav aria-label="${text.navigation}">${itemList}</nav></div>`,
      ].join(""),
    );
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

test("shows the app icon with the name of Portolab where no part starts the top bar, and leaves out the tab bar without items and the profile without a person", () => {
  const html = frameForTest({
    frameItems: [],
    start: undefined,
    frameProfile: undefined,
  });
  expect(html).toContain(
    `<header><div data-layout="content"><a href="/" data-discover="true">${withoutClasses(renderInRouterForTest(<AppIcon />))}Portolab</a><div><span>tools</span><span>badge</span></div></div></header>`,
  );
  expect(html).not.toContain("popoverTarget");
  expect(html).not.toContain("<ul>");
  expect(html).toMatch(/<\/main><\/div><\/div>$/);
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
