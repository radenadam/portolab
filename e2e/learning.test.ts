import { expectRefusedGlossarySearch } from "./expect-refused-glossary-search.ts";
import { returnFromLesson } from "./return-from-lesson.ts";
import { languageNames } from "../app/language-names.ts";
import { expect, test } from "@playwright/test";
import { captureScreens } from "./capture-screens.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { fieldMaximumLength } from "../app/form-size.ts";
import { glossaryQueryMaximumLength } from "../app/features/learning/glossary-query-maximum-length.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { lessonSessionsForTest } from "./lesson-sessions-for-test.ts";

const texts: Record<
  Locale,
  {
    learn: string;
    glossary: string;
    openLesson: string;
    glossaryLink: string;
    searchField: string;
    terms: string;
    lesson: string;
    beta: string;
    sessionLink: string;
    back: string;
    week: string;
    none: string;
    one: string;
    many: string;
    notFound: string;
  }
> = {
  id: {
    learn: "Belajar",
    glossary: "Kamus",
    openLesson: "Buka di Belajar",
    glossaryLink: "Kamus istilah",
    searchField: "Cari istilah atau artinya",
    terms: "Istilah kunci",
    lesson: "CAPM dan garis pasar sekuritas",
    beta: "Beta",
    sessionLink: "Sesi 9: CAPM dan garis pasar sekuritas",
    back: "Kembali ke halaman sebelumnya",
    week: "Ringkasan · minggu ini",
    none: 'Tidak ada istilah yang memuat "xyzz". Coba kata yang lebih pendek.',
    one: "1 istilah",
    many: "44 istilah",
    notFound: "Halaman tidak ditemukan",
  },
  en: {
    learn: "Learn",
    glossary: "Glossary",
    openLesson: "Open in Learn",
    glossaryLink: "Glossary",
    searchField: "Search terms or definitions",
    terms: "Key terms",
    lesson: "CAPM and the security market line",
    beta: "Beta",
    sessionLink: "Session 9: CAPM and the security market line",
    back: "Back to the previous page",
    week: "Summary · this week",
    none: 'No terms contain "xyzz". Try a shorter word.',
    one: "1 term",
    many: "44 terms",
    notFound: "Page not found",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`reads the sessions, every lesson, and every term in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/learn",
    });
    const classPath = new URL(page.url()).pathname.replace(/\/learn$/u, "");
    await expect(page).toHaveTitle(`${text.learn} | Portolab`);
    await expect(page.locator('main [aria-current="step"]')).toContainText(
      text.week,
    );
    await expect(page.locator('main a[href*="/learn/"]')).toHaveCount(12);
    await expect(page.locator("main article")).toHaveCount(4);
    await expect(page.locator('nav a[aria-current="page"]').last()).toHaveText(
      text.learn,
    );
    await expectAccessibleScreen(page);
    await captureScreens(page, testInfo, {
      name: `learn-${locale}`,
      fullPage: true,
      fromTop: true,
    });
    await testInfo.attach(`sessions-${locale}`, {
      body: await page.locator("main").innerText(),
      contentType: "text/plain",
    });
    await lecturer.goto(`${classPath}/learn`);
    await expect(
      lecturer.locator('nav a[aria-current="page"]').last(),
    ).toHaveText(text.learn);
    for (const session of lessonSessionsForTest) {
      await page.goto(`${classPath}/learn/${String(session)}`);
      await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(1);
      await expect(
        page.getByRole("heading", { name: text.terms, exact: true }),
      ).toBeVisible();
      await expect(page.locator("main input")).toHaveCount(0);
      for (const term of await page.locator("main details").all()) {
        await term.locator("summary").click();
        await expect(term.locator("p").first()).toBeVisible();
        await term.locator("summary").click();
      }
      await expectAccessibleScreen(page);
      await testInfo.attach(`session-${String(session)}-${locale}`, {
        body: (await page.locator("main").textContent()) ?? "",
        contentType: "text/plain",
      });
      expect(await layoutProblems(page)).toEqual([]);
      if (session === 9) {
        await page.locator("#term-beta summary").click();
        await expectAccessibleScreen(page);
        await page.locator("#term-beta summary").click();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          text.lesson,
        );
        await captureScreens(page, testInfo, {
          name: `lesson-9-${locale}`,
          fullPage: true,
          fromTop: true,
        });
      }
    }
    for (const session of [7, 8, 15, 16, 0, 17, "09", "prices"])
      await expectMissingPage(
        page,
        `${classPath}/learn/${String(session)}`,
        text.notFound,
      );
    await page.goto(`${classPath}/glossary`);
    await expect(page).toHaveTitle(`${text.glossary} | Portolab`);
    await expect(page.getByRole("status")).toHaveText(text.many);
    await expect(page.locator('main section[id^="term-"]')).toHaveCount(44);
    await expectAccessibleScreen(page);
    await captureScreens(page, testInfo, {
      name: `glossary-${locale}`,
      fullPage: false,
      fromTop: true,
    });
    await testInfo.attach(`glossary-${locale}`, {
      body: await page.locator("main").innerText(),
      contentType: "text/plain",
    });
    for (const term of await page.locator('main section[id^="term-"]').all()) {
      await term.scrollIntoViewIfNeeded();
      await expect(term.getByRole("heading")).toBeVisible();
      await expect(term.locator("p").first()).toBeVisible();
      await expect(term.getByRole("link")).toHaveAttribute(
        "href",
        new RegExp(
          `/learn/(${lessonSessionsForTest.join("|")})\\?returnTo=`,
          "u",
        ),
      );
    }
    await expectRefusedGlossarySearch(
      page,
      "a".repeat(glossaryQueryMaximumLength + 1),
    );
    await page.getByRole("searchbox", { name: text.searchField }).fill("beta");
    await page.getByRole("searchbox").press("Enter");
    const beta = page.locator("#term-beta");
    await beta
      .getByRole("link", { name: text.sessionLink, exact: true })
      .click();
    const sheet = page.getByRole("dialog", { name: text.lesson });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: text.openLesson }).click();
    await returnFromLesson(page, {
      lesson: text.lesson,
      back: text.back,
      address: `${classPath}/glossary?q=beta#term-beta`,
    });
    await expect(page.getByRole("searchbox")).toHaveValue("beta");
    await lecturer.context().close();
  });

  test(`hides learning pages of another class in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFound,
      addresses: ({ classPath, otherClassPath }) =>
        ["/learn", "/learn/9", "/glossary"].flatMap((path) => [
          { reader: "student" as const, path: `${otherClassPath}${path}` },
          { reader: "otherLecturer" as const, path: `${classPath}${path}` },
        ]),
    });
  });

  test(`keeps a glossary search typed before JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/glossary",
    });
    await holdClientScripts(
      page,
      { otherDevice: lecturer.context() },
      async (loadClient) => {
        const search = page.getByRole("searchbox", { name: text.searchField });
        await search.fill("ARA (");
        await loadClient();
        await expect(search).toHaveValue("ARA (");
        const response = page.waitForResponse((answer) =>
          new URL(answer.url()).pathname.endsWith("/glossary.data"),
        );
        await search.press("Enter");
        await response;
        await expect(page.getByRole("status")).toHaveText(text.one);
        await expect(search).toHaveValue("ARA (");
      },
    );
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    // Axe runs scripts in the page, so the tests with JavaScript check accessibility and these tests check native controls.
    test.use({ javaScriptEnabled: false });
    test("searches titles and definitions, opens terms, and follows concept lessons", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        path: "/learn",
      });
      const classPath = new URL(page.url()).pathname.replace(/\/learn$/u, "");
      await page
        .getByRole("main")
        .getByRole("link", { name: text.glossaryLink, exact: true })
        .click();
      const search = page.getByRole("searchbox", { name: text.searchField });
      for (const [query, count] of [
        ["ARA (", text.one],
        ["xyzz", ""],
        ["linear", text.one],
      ] as const) {
        await search.fill(query);
        await search.press("Enter");
        if (query === "xyzz")
          await expect(
            page.getByText(text.none, { exact: true }),
          ).toBeVisible();
        else await expect(page.getByRole("status")).toHaveText(count);
      }
      await search.fill("a".repeat(glossaryQueryMaximumLength));
      await search.press("Enter");
      await expect(search).toHaveValue("a".repeat(glossaryQueryMaximumLength));
      expect(await layoutProblems(page)).toEqual([]);
      const refused = await page.goto(
        `${classPath}/glossary?q=${"a".repeat(glossaryQueryMaximumLength + 1)}`,
      );
      expect(refused?.status()).toBe(400);
      await expect(page.getByRole("alert")).toBeVisible();
      expect(await layoutProblems(page)).toEqual([]);
      const wideQuery = "あ".repeat(fieldMaximumLength);
      await expectRefusedGlossarySearch(page, wideQuery);
      await page.goto(`${classPath}/learn/9`);
      await page.getByText(text.beta, { exact: true }).click();
      await expect(page.locator("#term-beta p")).toBeVisible();
      expect(await layoutProblems(page)).toEqual([]);
      await page.goto(`${classPath}/stocks/BBCA?range=3m`);
      await page.locator("main button[popovertarget]").first().click();
      const lesson = page.getByRole("dialog").locator('a[href*="/learn/"]');
      await expect(lesson).toBeVisible();
      await lesson.click();
      await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
      await page.getByRole("link", { name: text.back, exact: true }).click();
      await expect(page).toHaveURL(`${classPath}/stocks/BBCA?range=3m`);
      await lecturer.context().close();
    });
  });
}
