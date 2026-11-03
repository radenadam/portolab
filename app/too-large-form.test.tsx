import { renderToStaticMarkup } from "react-dom/server";
import { createRoutesStub } from "react-router";
import { expect, test } from "vitest";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { TooLargeFormPage, tooLargeFormStatus } from "./too-large-form";

const texts: Record<
  Locale,
  {
    title: string;
    stated: string;
    widest: string;
    unstated: string;
    openFormLink: string;
  }
> = {
  id: {
    title: "Formulir terlalu besar",
    stated:
      "Formulir ini berukuran 128.040 byte, tetapi Portolab menerima formulir paling besar 128.000 byte. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    widest:
      "Formulir ini berukuran 999.999.999.999.999 byte, tetapi Portolab menerima formulir paling besar 128.000 byte. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    unstated:
      "Formulir ini berukuran lebih dari 128.000 byte, yaitu ukuran terbesar yang Portolab terima untuk sebuah formulir. Hal ini terjadi jika teks yang sangat panjang ditempel ke sebuah kolom. Buka formulirnya lagi, lalu isi setiap kolom dengan teks yang lebih pendek.",
    openFormLink: "Buka formulirnya lagi",
  },
  en: {
    title: "The form is too large",
    stated:
      "This form has 128,040 bytes, but Portolab accepts a form of at most 128,000 bytes. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    widest:
      "This form has 999,999,999,999,999 bytes, but Portolab accepts a form of at most 128,000 bytes. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    unstated:
      "This form has more than 128,000 bytes, which is the most that Portolab accepts in a form. This happens when a very long text is pasted into a field. Open the form again and fill in each field with a shorter text.",
    openFormLink: "Open the form again",
  },
};

const formPath = "/sign-in?returnTo=%2Fclasses";

/** Renders the page for the refusal of a form at the address of the form, with the size that the refusal holds, inside a router, because its link needs one. */
function renderTooLargeFormPage(statedSize: number | null): string {
  // React Router gives the error boundary a refusal in this shape.
  const refusal = {
    status: tooLargeFormStatus,
    statusText: "",
    internal: false,
    data: statedSize,
  };
  const Stub = createRoutesStub([
    {
      path: "/sign-in",
      Component: () => <TooLargeFormPage refusal={refusal} />,
    },
  ]);
  return renderToStaticMarkup(<Stub initialEntries={[formPath]} />);
}

for (const locale of locales) {
  const text = texts[locale];

  test(`explains a form larger than the limit with the size that it stated, or without one, and links to the form, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [statedSize, body] of [
      [128_040, text.stated],
      // The limit reads a stated size of at most fifteen digits, so this is the widest size that the page shows.
      [999_999_999_999_999, text.widest],
      [null, text.unstated],
    ] as const) {
      const html = renderTooLargeFormPage(statedSize);
      expect(html).toContain(`<title>${text.title} | Portolab</title>`);
      expect(html).toContain(`<h1>${text.title}</h1>`);
      expect(html).toContain(`<p>${body}</p>`);
      expect(html).toContain(`href="${formPath}"`);
      expect(html).toContain(`>${text.openFormLink}</a>`);
    }
  });
}
