import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { studentOnNewClass } from "./student-on-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

const headings: Record<Locale, string> = { id: "Beranda", en: "Home" };

for (const javaScriptEnabled of [true, false]) {
  test.describe(`with JavaScript ${String(javaScriptEnabled)}`, () => {
    test.use({ javaScriptEnabled });

    for (const locale of locales) {
      test(`prepares an existing student without requesting signup or joining in ${languageNames[locale]}`, async ({
        page,
        browser,
      }) => {
        const joinRequests: string[] = [];
        page.on("request", (request) => {
          if (new URL(request.url()).pathname.startsWith("/join")) {
            joinRequests.push(request.url());
          }
        });
        const { lecturer, testClass } = await studentOnNewClass(page, browser, {
          locale,
          ...widestClassNames,
        });
        await expect(page).toHaveURL(testClass.path);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          headings[locale],
        );
        expect(joinRequests).toEqual([]);
        await lecturer.context().close();
      });
    }
  });
}
