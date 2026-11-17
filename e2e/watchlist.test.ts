import { expect, test } from "@playwright/test";
import type { Page, APIResponse, Locator } from "@playwright/test";
import { locales, type Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { newDevice } from "./new-device.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { captureScreens } from "./capture-screens.ts";
import { createTestClass } from "./create-test-class.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { bbcaHolding } from "./bbca-holding.ts";

const texts: Record<
  Locale,
  {
    title: string;
    add: string;
    remove: string;
    watch: string;
    back: string;
    lots: string;
    reason: string;
    done: string;
  }
> = {
  id: {
    title: "Pantauan Anda",
    add: "Tambah BBCA ke pantauan",
    remove: "Hapus BBCA dari pantauan",
    watch: "Pantau",
    back: "Kembali ke Pasar",
    lots: "Jumlah lot",
    reason: "Alasan (opsional)",
    done: "Selesai",
  },
  en: {
    title: "Your watchlist",
    add: "Add BBCA to your watchlist",
    remove: "Remove BBCA from your watchlist",
    watch: "Watch",
    back: "Back to Market",
    lots: "Lots",
    reason: "Reason (optional)",
    done: "Done",
  },
};

async function addMarketStar(page: Page, locale: Locale): Promise<void> {
  await addStar(page.locator("#stock-BBCA"), locale);
  await expect(
    page.getByRole("region", { name: texts[locale].title }),
  ).toBeVisible();
}

async function addStar(within: Locator, locale: Locale): Promise<void> {
  await within
    .getByRole("button", { name: texts[locale].add, exact: true })
    .click({ noWaitAfter: true });
  await expect(
    within.getByRole("button", { name: texts[locale].remove, exact: true }),
  ).toBeEnabled();
}

function postWatchlist(
  page: Page,
  path: string,
  returnTo: string,
): Promise<APIResponse> {
  return page.request.post(path, {
    headers: { Origin: new URL(page.url()).origin },
    form: { returnTo },
    maxRedirects: 0,
  });
}

for (const locale of locales) {
  const text = texts[locale];
  test(`keeps personal stars through native forms and hydration in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      {
        locale,
        ...widestClassNames,
      },
    );
    storeTestHolding(classId, bbcaHolding);
    const native = await newDevice(browser, locale, {
      sessionFrom: student,
      javaScriptEnabled: false,
    });
    try {
      const market = `${classPath}/market`;
      await native.goto(market);
      await addMarketStar(native, locale);
      const watched = native.getByRole("region", {
        name: text.title,
        exact: true,
      });
      await expect(watched).toBeVisible();
      await expect(
        watched.getByRole("button", { name: text.remove, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await watched.getByRole("link", { name: /BBCA/ }).click();
      await expect(
        native.getByRole("button", { name: text.remove, exact: true }),
      ).toBeVisible();
      await native
        .getByRole("button", { name: text.remove, exact: true })
        .click();
      await expect(
        native.getByRole("button", { name: text.add, exact: true }),
      ).toBeVisible();
      await native.getByRole("link", { name: text.back, exact: true }).click();
      await expect(
        native
          .locator("#stock-BBCA")
          .getByRole("button", { name: text.add, exact: true }),
      ).toBeInViewport();
      await expect(watched).toHaveCount(0);
      await holdClientScripts(
        student,
        { address: market },
        async (loadClient) => {
          await addMarketStar(student, locale);
          await loadClient();
          await expect(
            student.getByRole("slider", { name: "IHSG", exact: true }),
          ).toBeVisible();
          await expect(
            student
              .locator("#stock-BBCA")
              .getByRole("button", { name: text.remove, exact: true }),
          ).toHaveAttribute("aria-pressed", "true");
          await student
            .locator("#stock-BBCA")
            .getByRole("button", { name: text.remove, exact: true })
            .click();
          await expect(
            student.getByRole("region", { name: text.title }),
          ).toHaveCount(0);
        },
      );
      await addMarketStar(student, locale);
      await captureScreens(student, testInfo, {
        name: `watchlist-market-${locale}`,
        fullPage: true,
        fromTop: true,
        check: async () => {
          expect(await layoutProblems(student)).toEqual([]);
        },
      });
      await expectAccessibleScreen(student);
      await student
        .locator("#watched-stock-BBCA")
        .getByRole("link", { name: /BBCA/ })
        .click();
      await expect(
        student.getByRole("heading", { level: 1, name: "BBCA", exact: true }),
      ).toBeVisible();
      await expect(
        student.getByRole("button", { name: text.remove, exact: true }),
      ).toBeVisible();
      await captureScreens(student, testInfo, {
        name: `watchlist-stock-${locale}`,
        fullPage: true,
        fromTop: true,
        check: async () => {
          expect(await layoutProblems(student)).toEqual([]);
        },
      });
      await expectAccessibleScreen(student);
      await student.locator('a[data-stock-trade="buy"]').click();
      await expect(
        student.locator('dialog form[data-ticket-ready="true"]'),
      ).toBeVisible();
      await student
        .getByRole("textbox", { name: text.lots, exact: true })
        .fill("2");
      await student
        .getByRole("textbox", { name: text.reason, exact: true })
        .fill("Eksperimen bobot portofolio");
      if (!testInfo.project.use.isMobile) {
        const star = student.getByRole("button", {
          name: text.remove,
          exact: true,
        });
        await star.focus();
        await star.press("Enter");
        await expect(
          student.getByRole("button", { name: text.add, exact: true }),
        ).toBeVisible();
        await expect(
          student.getByRole("textbox", { name: text.lots, exact: true }),
        ).toHaveValue("2");
        await expect(
          student.getByRole("textbox", { name: text.reason, exact: true }),
        ).toHaveValue("Eksperimen bobot portofolio");
        await addStar(student.getByRole("main"), locale);
      }
      await captureScreens(student, testInfo, {
        name: `watchlist-ticket-${locale}`,
        fullPage: true,
        fromTop: true,
        check: async () => {
          expect(await layoutProblems(student)).toEqual([]);
        },
      });
      if (testInfo.project.use.isMobile) {
        await student
          .getByRole("link", { name: text.done, exact: true })
          .click();
        await student
          .getByRole("button", { name: text.remove, exact: true })
          .click();
        await addStar(student.getByRole("main"), locale);
      } else {
        await expect(
          student.getByRole("link", { name: text.done, exact: true }),
        ).toHaveCount(0);
      }
      await student.getByRole("link", { name: text.back, exact: true }).click();
      await expect(
        student
          .locator("#watched-stock-BBCA")
          .getByRole("button", { name: text.remove, exact: true }),
      ).toBeInViewport();
      await expect(
        student
          .getByRole("columnheader", { name: text.watch, exact: true })
          .first(),
      ).toBeAttached();
      await student.goto(`${market}?q=TLKM`);
      await expect(
        student.getByRole("region", { name: text.title }),
      ).toHaveCount(0);
      await student.goto(market);
      await expect(
        student.getByRole("region", { name: text.title }),
      ).toBeVisible();
    } finally {
      await native.context().close();
      await student.context().close();
    }
  });

  test(`shares stars across a person's classes and refuses other owners and malformed actions in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    try {
      const market = `${classPath}/market`;
      await student.goto(market);
      await addMarketStar(student, locale);
      await page.goto(market);
      await expect(page.getByRole("region", { name: text.title })).toHaveCount(
        0,
      );
      await addMarketStar(page, locale);
      const second = await createTestClass(page, "Kelas Kedua");
      await page.goto(`${second.path}/market`);
      await expect(
        page.getByRole("region", { name: text.title }),
      ).toBeVisible();
      const denied = await postWatchlist(
        student,
        `${second.path}/watchlist/BBCA/remove`,
        market,
      );
      expect(denied.status()).toBe(404);
      for (const tail of [
        "BBCA/toggle",
        "BBCA/toggles",
        "WRONG/add",
        `${"A".repeat(1000)}/add`,
        "BBCA/" + "a".repeat(1000),
      ]) {
        const response = await postWatchlist(
          student,
          `${classPath}/watchlist/${tail}`,
          market,
        );
        expect(response.status()).toBe(404);
      }
      const crossSite = await student.request.post(
        `${classPath}/watchlist/BBCA/remove`,
        {
          headers: { Origin: "https://outside.example" },
          form: { returnTo: market },
          maxRedirects: 0,
        },
      );
      expect(crossSite.status()).toBe(403);
      await student.goto(market);
      await expect(
        student.getByRole("region", { name: text.title }),
      ).toBeVisible();
      const get = await student.goto(`${classPath}/watchlist/BBCA/add`);
      expect(get?.status()).toBe(404);
      expect(get?.headers()["content-type"]).toContain("text/html");
      await student.context().clearCookies();
      const signedOut = await postWatchlist(
        student,
        `${classPath}/watchlist/BBCA/add`,
        `${market}#stock-BBCA`,
      );
      expect(signedOut.status()).toBe(302);
      expect(signedOut.headers()["location"]).toBe(
        `/sign-in?returnTo=${encodeURIComponent(`${market}#stock-BBCA`)}`,
      );
    } finally {
      await student.context().close();
    }
  });
}
