import type { Page, Browser } from "@playwright/test";
import { expectRefusedGlossarySearch } from "./expect-refused-glossary-search.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { glossaryQueryMaximumLength } from "../app/features/learning/glossary-query-maximum-length.ts";
import { returnFromLesson } from "./return-from-lesson.ts";
import { isPhone } from "./frame.ts";
import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { captureScreens } from "./capture-screens.ts";

const texts: Record<
  Locale,
  {
    help: string;
    lesson: string;
    more: string;
    close: string;
    full: string;
    back: string;
    glossary: string;
    search: string;
    reason: string;
  }
> = {
  id: {
    help: "Apa itu Jumlah lot?",
    lesson: "Mekanisme perdagangan",
    more: "Pelajari lebih lanjut di sesi 6",
    close: "Tutup",
    full: "Buka di Belajar",
    back: "Kembali ke halaman sebelumnya",
    glossary: "Kamus",
    search: "Cari istilah atau artinya",
    reason: "Alasan yang sedang ditulis.",
  },
  en: {
    help: "What is Lots?",
    lesson: "The mechanism of trading",
    more: "Learn more in session 6",
    close: "Close",
    full: "Open in Learn",
    back: "Back to the previous page",
    glossary: "Glossary",
    search: "Search terms or definitions",
    reason: "A reason still being written.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`keeps the ticket, address, and focus through lessons and terms in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const { lecturer } = await openTicket(page, browser, locale);
    try {
      const address = page.url();
      const lots = page.locator("#ticket-lots");
      const reason = page.locator("#ticket-reason");
      await expect(page.locator("[data-ticket-ready=true]")).toBeVisible();
      await lots.fill("37");
      await reason.fill(text.reason);
      const help = page.getByRole("button", { name: text.help, exact: true });
      await help.click();
      const position = await screenPosition(page);
      const more = page.getByRole("link", { name: text.more, exact: true });
      await more.click();
      const lesson = page.getByRole("dialog", {
        name: text.lesson,
        exact: true,
      });
      const closeLessonAndHelp = async () => {
        await page.keyboard.press("Escape");
        await expect(lesson).toHaveCount(0);
        await expect(more).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(help).toBeFocused();
        await expect(lots).toHaveValue("37");
        await expect(reason).toHaveValue(text.reason);
        await expect(page).toHaveURL(address);
      };
      await expect(lesson).toBeVisible();
      await expect(page.locator("[popover]:popover-open")).toHaveCount(0);
      await expect(page).toHaveURL(address);
      await expect(lesson.getByRole("link", { name: text.full })).toBeVisible();
      await expectAccessibleScreen(page);
      await closeLessonAndHelp();
      expect(await screenPosition(page)).toEqual(position);
      const viewport = page.viewportSize();
      if (viewport === null)
        throw new Error("The sheet test needs a fixed viewport.");
      for (const width of [isPhone() ? 1440 : 360, viewport.width]) {
        await help.click();
        await more.click();
        await expect(lesson).toBeVisible();
        await page.setViewportSize({ ...viewport, width });
        await closeLessonAndHelp();
      }
      await help.click();
      await more.click();
      await captureScreens(page, testInfo, {
        name: `lesson-over-ticket-${locale}`,
        fullPage: false,
        fromTop: false,
      });
      await page.mouse.click(1, 1);
      await expect(lesson).toHaveCount(0);
      await expect(more).toBeFocused();
      await page.keyboard.press("Escape");
      await help.click();
      const glossaryLink = page
        .getByRole("dialog")
        .getByRole("link", { name: text.glossary, exact: true });
      await glossaryLink.click();
      const glossary = page.getByRole("dialog", {
        name: text.glossary,
        exact: true,
      });
      await expect(glossary).toBeVisible();
      await expect(page.locator("[popover]:popover-open")).toHaveCount(0);
      await expect(glossary.locator('[id$="term-lot"]')).toBeInViewport();
      await expectAccessibleScreen(page);
      const search = glossary.getByRole("searchbox", { name: text.search });
      await search.fill("あ".repeat(glossaryQueryMaximumLength));
      await search.press("Enter");
      await expect(glossary.locator('[id$="term-lot"]')).toHaveCount(0);
      await expect(glossary.getByRole("alert")).toHaveCount(0);
      for (const query of [
        "あ".repeat(glossaryQueryMaximumLength + 1),
        "あ".repeat(fieldMaximumLength),
      ]) {
        await expectRefusedGlossarySearch(page, query, glossary);
        await expect(glossary.getByRole("alert")).toContainText(
          new Intl.NumberFormat(locale).format(query.length),
        );
        await expect(page).toHaveURL(address);
      }
      await glossary.getByRole("searchbox", { name: text.search }).fill("beta");
      await glossary.getByRole("searchbox").press("Enter");
      const beta = glossary.locator('[id$="term-beta"]');
      await expect(beta).toBeVisible();
      await expect(glossary.locator('[id$="term-lot"]')).toHaveCount(0);
      await expect(page).toHaveURL(address);
      await beta.getByRole("link").click();
      const nested = page
        .getByRole("dialog")
        .filter({ has: page.getByRole("link", { name: text.full }) })
        .last();
      await expect(nested).toBeVisible();
      await page.setViewportSize({
        ...viewport,
        width: isPhone() ? 1440 : 360,
      });
      await expect(nested).toBeVisible();
      await page.keyboard.press("Escape");
      await glossary
        .getByRole("button", { name: text.close, exact: true })
        .click();
      await expect(glossaryLink).toBeFocused();
      await page.keyboard.press("Escape");
      await page.setViewportSize(viewport);
      await expect(lots).toHaveValue("37");
      await expect(reason).toHaveValue(text.reason);
      await help.click();
      await more.click();
      await lesson.getByRole("link", { name: text.full }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        text.lesson,
      );
      await page.goBack();
      await expect(page).toHaveURL(address);
      await expect(lots).toHaveValue("37");
      await expect(reason).toHaveValue(text.reason);
      await page.reload();
      await expect(lots).toHaveValue("37");
      await expect(reason).toHaveValue(text.reason);
      await page
        .locator("[data-ticket-ready=true] button[type=submit]")
        .click();
      await expect(page.locator("[data-ticket-ready=true]")).toHaveCount(0);
      await page.goto(address);
      await expect(lots).toHaveValue("1");
      await expect(reason).toHaveValue("");
    } finally {
      await lecturer.context().close();
    }
  });

  test(`keeps native fields and an open help card when the sheet enhancement starts in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openTicket(page, browser, locale);
    await holdClientScripts(
      page,
      { otherDevice: lecturer.context() },
      async (loadClient) => {
        const address = page.url();
        await visitNativeLessonAndReturn(page, text, address);
        await page.locator("#ticket-lots").fill("23");
        await page.locator("#ticket-reason").fill(text.reason);
        await page
          .getByRole("button", { name: text.help, exact: true })
          .click();
        const more = page.getByRole("link", { name: text.more, exact: true });
        await expect(more).toBeVisible();
        await expect(more).toHaveAttribute("href", /\/learn\/6\?returnTo=/u);
        await loadClient();
        await expect(page.locator("[data-ticket-ready=true]")).toBeVisible();
        await expect(more).toBeVisible();
        await more.click();
        await expect(
          page.getByRole("dialog", { name: text.lesson, exact: true }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(more).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(page.locator("#ticket-lots")).toHaveValue("23");
        await expect(page.locator("#ticket-reason")).toHaveValue(text.reason);
        await expect(page).toHaveURL(address);
      },
    );
  });

  test.describe(`before JavaScript loads in ${languageNames[locale]}`, () => {
    test.use({ javaScriptEnabled: false });
    test("navigates from the ticket to its lesson and term with a path back", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openTicket(page, browser, locale);
      try {
        const address = page.url();
        await visitNativeLessonAndReturn(page, text, address);
        await page
          .getByRole("button", { name: text.help, exact: true })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("link", { name: text.glossary, exact: true })
          .click();
        await expect(page).toHaveURL(/\/glossary\?returnTo=.+#term-lot$/u);
        await expect(page.locator("#term-lot")).toBeInViewport();
        await page.getByRole("link", { name: text.back, exact: true }).click();
        await expect(page).toHaveURL(address);
      } finally {
        await lecturer.context().close();
      }
    });
  });
}

function openTicket(
  page: Page,
  browser: Browser,
  locale: Locale,
): Promise<{ lecturer: Page }> {
  return openAsNewStudent(page, browser, {
    locale,
    path: "/stocks/BBCA/buy?range=3m",
  });
}

function screenPosition(page: Page): Promise<{ page: number; ticket: number }> {
  return page.evaluate(() => {
    const ticket = document.querySelector("dialog[open]");
    if (!(ticket instanceof HTMLDialogElement))
      throw new Error("The ticket is not open.");
    return { page: window.scrollY, ticket: ticket.scrollTop };
  });
}

async function visitNativeLessonAndReturn(
  page: Page,
  text: (typeof texts)[Locale],
  address: string,
): Promise<void> {
  await page.getByRole("button", { name: text.help, exact: true }).click();
  await page
    .getByRole("link", { name: text.more, exact: true })
    .click({ noWaitAfter: true });
  await returnFromLesson(page, {
    lesson: text.lesson,
    back: text.back,
    address,
  });
}
