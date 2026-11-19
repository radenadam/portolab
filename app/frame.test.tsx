import { expect, test } from "vitest";
import { AppIcon } from "./app-icon";
import { Frame } from "./frame";
import type { FrameProfile } from "./frame";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { renderMarkupForTest } from "./render-markup-for-test";

const texts: Record<
  Locale,
  {
    skip: string;
    navigation: string;
    profile: string;
    profileTitle: string;
    sample: string;
  }
> = {
  id: {
    skip: "Lewati ke konten",
    navigation: "Navigasi utama",
    profile: "Profil Sari Wulandari",
    profileTitle: "Profil",
    sample: "Data contoh",
  },
  en: {
    skip: "Skip to content",
    navigation: "Main navigation",
    profile: "Profile of Sari Wulandari",
    profileTitle: "Profile",
    sample: "sample class",
  },
};

// The icon of an item is a path of its own, which the test leaves out to read the items.
function withoutIcons(html: string): string {
  return html.replaceAll(/<svg viewBox="0 0 24 24".*?<\/svg>/g, "");
}

const items = [
  {
    path: "/classes/7",
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
  look: "own",
  menu: <span>menu</span>,
};

const avatar = '<span data-initials="SW" aria-hidden="true"></span>';

// The name of a desktop and the avatar of a phone open the one menu of the profile.
function profileButton(text: { profile: string }, content: string): string {
  return `<button type="button" popoverTarget="top-profile" aria-label="${text.profile}" style="anchor-name:--top-profile">${content}</button>`;
}

function profilePopover(text: { profileTitle: string }): string {
  return `<div id="top-profile" popover="auto" role="dialog" aria-label="${text.profileTitle}" style="position-anchor:--top-profile"><span>menu</span></div>`;
}

function frameForTest({
  frameItems,
  start,
  frameProfile,
  sampleClassLabel,
  workspaceTools,
}: {
  frameItems: readonly (typeof items)[number][];
  start: string | undefined;
  frameProfile: FrameProfile | undefined;
  sampleClassLabel?: string;
  workspaceTools?: string;
}): string {
  return withoutIcons(
    renderMarkupForTest(
      <Frame
        sampleClassLabel={sampleClassLabel}
        items={frameItems}
        start={start === undefined ? undefined : <span>{start}</span>}
        profile={frameProfile}
        tools={<span>tools</span>}
        badge={<span>badge</span>}
        workspaceTools={
          workspaceTools === undefined ? undefined : (
            <span>{workspaceTools}</span>
          )
        }
      >
        <p>page</p>
      </Frame>,
    ),
  );
}

const itemList =
  '<ul><li><a aria-current="page" href="/classes/7" data-discover="true">Beranda</a></li><li><a href="/classes/7/market" data-discover="true">Pasar</a></li></ul>';

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`labels every frame of a sample database in ${language}`, () => {
    switchLocaleForTest(locale);
    const parts = {
      frameItems: items,
      start: "switcher",
      frameProfile: profile,
    };
    expect(frameForTest({ ...parts, sampleClassLabel: text.sample })).toContain(
      `<aside aria-label="${text.sample}">${text.sample}</aside>`,
    );
    expect(frameForTest(parts)).not.toContain(text.sample);
  });

  test(`frames a page with the link that skips to the content, the rail with the app icon and the items, the top bar with its start, the tools, the name with the avatar, the badge, and the avatar of a phone, which open one menu of the profile, the content in the middle, and the tab bar, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = frameForTest({
      frameItems: items,
      start: "switcher",
      frameProfile: profile,
    });
    const icon = renderMarkupForTest(<AppIcon />);
    expect(html).toBe(
      [
        `<a href="#main">${text.skip}</a><div>`,
        `<nav aria-label="${text.navigation}"><a aria-label="Portolab" href="/" data-discover="true">${icon}</a>${itemList}</nav>`,
        `<div><header><div data-layout="content"><span>switcher</span><div><span>tools</span>`,
        `<span>${profileButton(text, `${avatar}<span>Sari Wulandari</span>`)}</span><span>badge</span>`,
        `${profileButton(text, avatar)}${profilePopover(text)}</div></div></header>`,
        `<aside hidden=""></aside><main id="main" tabindex="-1"><div data-layout="content"><p>page</p></div></main></div>`,
        `<nav aria-label="${text.navigation}">${itemList}</nav></div>`,
      ].join(""),
    );
  });

  test(`keeps the name that opens the menu of the profile beside the tools of a workspace, such as the code for joining, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = frameForTest({
      frameItems: items,
      start: "switcher",
      frameProfile: profile,
      workspaceTools: "join",
    });
    expect(html).toContain(
      `<div><span>tools</span><span><span>join</span></span><span>${profileButton(text, `${avatar}<span>Sari Wulandari</span>`)}</span><span>badge</span>`,
    );
  });

  test(`keeps the app icon named outside a workspace when the wordmark can be hidden in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = frameForTest({
      frameItems: [],
      start: undefined,
      frameProfile: undefined,
    });
    expect(html).toContain(
      `<header><div data-layout="content"><a aria-label="Portolab" href="/" data-discover="true">${renderMarkupForTest(<AppIcon />)}<span>Portolab</span></a><div><span>tools</span><span>badge</span></div></div></header>`,
    );
    expect(html).not.toContain("popoverTarget");
    expect(html).not.toContain("<ul>");
    expect(html).toMatch(/<\/main><\/div><\/div>$/);
  });
}
