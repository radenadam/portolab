import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { PopoverButton } from "./popover";

const texts: Record<Locale, { label: string; content: string }> = {
  id: { label: "Kode gabung", content: "Salin kode" },
  en: { label: "Join code", content: "Copy code" },
};

for (const locale of locales) {
  test(`keeps custom button attributes with its native popover anchor in ${languageNames[locale]}`, () => {
    const text = texts[locale];
    const html = renderToStaticMarkup(
      <PopoverButton
        popover="class-join"
        label={text.label}
        id="join-code"
        data-join-code="abcd-efgh"
      >
        <strong>{text.content}</strong>
      </PopoverButton>,
    );
    expect(html).toContain('id="join-code"');
    expect(html).toContain('data-join-code="abcd-efgh"');
    expect(html).toContain('type="button"');
    expect(html).toContain('popoverTarget="class-join"');
    expect(html).toContain('style="anchor-name:--class-join"');
    expect(html).toContain(`aria-label="${text.label}"`);
    expect(html).toContain(`<strong>${text.content}</strong>`);
  });
}
