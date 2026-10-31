import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { expect, test } from "vitest";
import { UnexpectedErrorPage } from "./error-page";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";

const texts: Record<
  Locale,
  { title: string; body: string; backHomeLink: string }
> = {
  id: {
    title: "Terjadi kesalahan",
    body: "Portolab tidak dapat menampilkan halaman ini. Coba muat ulang halaman. Jika masalahnya berlanjut, beri tahu dosen Anda.",
    backHomeLink: "Kembali ke beranda",
  },
  en: {
    title: "Something went wrong",
    body: "Portolab could not show this page. Try reloading the page. If the problem continues, tell your lecturer.",
    backHomeLink: "Back to the home page",
  },
};

/** Renders the page for an unexpected failure inside a router, because its link needs one. */
function renderUnexpectedErrorPage(): string {
  const Stub = createRoutesStub([
    { path: "/", Component: UnexpectedErrorPage },
  ]);
  return renderToStaticMarkup(<Stub />);
}

for (const locale of locales) {
  const text = texts[locale];

  test(`explains an unexpected failure in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = renderUnexpectedErrorPage();
    expect(html).toContain(`<title>${text.title} | Portolab</title>`);
    expect(html).toContain(`<h1>${text.title}</h1>`);
    expect(html).toContain(`<p>${text.body}</p>`);
    expect(html).toContain(`${text.backHomeLink}</a>`);
  });
}
