import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { homeWelcomeTextsForTest } from "../app/features/trading/home-welcome-texts-for-test.ts";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import { captureScreens } from "./capture-screens.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectWelcomeHeadingColors } from "./expect-welcome-heading-colors.ts";
import { layoutProblems } from "./expect-layout.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { newDevice } from "./new-device.ts";
import { returnFromLesson } from "./return-from-lesson.ts";
import { studentWithEmptyHome } from "./student-with-empty-home.ts";
import {
  widestClassNames,
  widestDigitClassNames,
} from "./widest-class-names.ts";

const flowTexts: Record<
  Locale,
  { betaHelp: string; value: string; waiting: string; back: string }
> = {
  id: {
    betaHelp: "Apa itu Beta?",
    value: "Nilai portofolio",
    waiting: "Order menunggu",
    back: "Kembali ke halaman sebelumnya",
  },
  en: {
    betaHelp: "What is Beta?",
    value: "Portfolio value",
    waiting: "Order waiting",
    back: "Back to the previous page",
  },
};

for (const locale of locales) {
  const text = homeWelcomeTextsForTest[locale];
  const flow = flowTexts[locale];
  test(`keeps the introduction stage when native navigation becomes a dialog in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithEmptyHome(page, browser, {
      locale,
    });
    try {
      await holdClientScripts(
        student,
        { address: classPath },
        async (loadClient) => {
          await student
            .getByRole("link", { name: text.open, exact: true })
            .click({ noWaitAfter: true });
          await expect(student).toHaveURL(`${classPath}?welcome=cash`);
          await student
            .getByRole("link", { name: text.next, exact: true })
            .click({ noWaitAfter: true });
          await expect(student).toHaveURL(`${classPath}?welcome=impact`);
          await expect(
            student.getByRole("heading", {
              name: text.impactTitle,
              exact: true,
            }),
          ).toBeVisible();
          await loadClient();
          const dialog = student.getByRole("dialog", {
            name: text.impactTitle,
            exact: true,
          });
          await expect(dialog).toBeVisible();
          await expect(
            dialog.getByRole("link", { name: text.next, exact: true }),
          ).toBeFocused();
          await dialog
            .getByRole("link", { name: text.next, exact: true })
            .click();
          const help = student.getByRole("dialog", {
            name: text.helpTitle,
            exact: true,
          });
          await expect(help).toBeVisible();
          await help
            .getByRole("button", { name: flow.betaHelp, exact: true })
            .click();
          await student.keyboard.press("Escape");
          await expect(help).toBeVisible();
          await student.keyboard.press("Escape");
          await expect(help).toHaveCount(0);
          await expect(student).toHaveURL(
            `${classPath}#home-welcome-onboarding`,
          );
          await expect(
            student.getByRole("link", { name: text.open, exact: true }),
          ).toBeFocused();
        },
      );
      await student.reload();
      await expect(
        student.getByRole("heading", { name: text.capital, exact: true }),
      ).toBeVisible();
      await expect(student.getByRole("dialog")).toHaveCount(0);
    } finally {
      await student.context().close();
    }
  });

  for (const [kind, names] of [
    ["letters", widestClassNames],
    ["digits", widestDigitClassNames],
  ] as const) {
    test(`fits the widest ${kind} and class cash on the welcome in ${languageNames[locale]}`, async ({
      page,
      browser,
    }, testInfo) => {
      const { student } = await studentWithEmptyHome(page, browser, {
        locale,
        names,
        startingCash: startingCashLimits.maximum,
      });
      try {
        const check = async () => {
          expect(await layoutProblems(student)).toEqual([]);
        };
        await expect(
          student.getByRole("heading", { name: text.capital, exact: true }),
        ).toBeVisible();
        await expectAccessibleScreen(student);
        await captureScreens(student, testInfo, {
          name: `welcome-${kind}-${locale}`,
          fullPage: true,
          fromTop: true,
          check: async () => {
            await check();
            await expectWelcomeHeadingColors(student);
          },
        });
        await student
          .getByRole("link", { name: text.open, exact: true })
          .click();
        await expect(student.getByRole("dialog")).toBeVisible();
        await expectAccessibleScreen(student);
        await captureScreens(student, testInfo, {
          name: `intro-cash-widest-${kind}-${locale}`,
          fullPage: false,
          fromTop: false,
          check,
        });
      } finally {
        await student.context().close();
      }
    });
  }

  for (const stage of ["cash", "impact", "help"] as const) {
    test(`keeps the ${stage} introduction at reference widths in ${languageNames[locale]}`, async ({
      page,
      browser,
    }, testInfo) => {
      const { student, classPath } = await studentWithEmptyHome(page, browser, {
        locale,
      });
      try {
        const address = student.url();
        await student
          .getByRole("link", { name: text.open, exact: true })
          .click();
        const titles = {
          cash: text.cashTitle,
          impact: text.impactTitle,
          help: text.helpTitle,
        };
        for (const current of ["cash", "impact"] as const) {
          if (current === stage) break;
          await student
            .getByRole("dialog", { name: titles[current], exact: true })
            .getByRole("link", { name: text.next, exact: true })
            .click();
        }
        const dialog = student.getByRole("dialog", {
          name: titles[stage],
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await expect(student).toHaveURL(address);
        await expectAccessibleScreen(student);
        await captureScreens(student, testInfo, {
          name: `intro-${stage}-${locale}`,
          fullPage: false,
          fromTop: false,
          check: async () => {
            expect(await layoutProblems(student)).toEqual([]);
          },
        });
        await dialog
          .getByRole("link", { name: text.skip, exact: true })
          .click();
        await expect(dialog).toHaveCount(0);
        const opener = student.getByRole("link", {
          name: text.open,
          exact: true,
        });
        await expect(opener).toBeFocused();
        await opener.press("Enter");
        await expect(
          student.getByRole("dialog", { name: text.cashTitle, exact: true }),
        ).toBeVisible();
        await student.keyboard.press("Escape");
        await expect(student).toHaveURL(classPath);
      } finally {
        await student.context().close();
      }
    });
  }

  test(`leaves the welcome after the first accepted order in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithEmptyHome(page, browser, {
      locale,
    });
    try {
      await expect(
        student.getByRole("heading", { name: text.capital, exact: true }),
      ).toBeVisible();
      await student.getByRole("link", { name: text.find, exact: true }).click();
      await expect(student).toHaveURL(`${classPath}/market`);
      await student
        .getByRole("link", { name: /BBCA.*Bank Central Asia/ })
        .click();
      await student.waitForURL(/\/stocks\/BBCA(?:\?|$)/);
      await student.locator('[data-stock-trade="buy"]').click();
      await expect(student.locator("[data-ticket-ready=true]")).toBeVisible();
      const ticket = student.locator("dialog[open]");
      await ticket
        .locator('form:has(input[name="lots"]) button[type="submit"]')
        .click();
      await expect(
        ticket.getByRole("heading", { name: flow.waiting, exact: true }),
      ).toBeVisible();
      await student.goto(classPath);
      await expect(
        student.getByRole("heading", { name: flow.value, exact: true }),
      ).toBeVisible();
      await expect(
        student.getByRole("heading", { name: text.capital, exact: true }),
      ).toHaveCount(0);
      await expect(
        student.getByRole("link", { name: text.open, exact: true }),
      ).toHaveCount(0);
    } finally {
      await student.context().close();
    }
  });

  test(`opens the price guide in place and returns to its native source in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithEmptyHome(page, browser, {
      locale,
    });
    try {
      const source = student.getByRole("link", {
        name: new RegExp(text.guide),
      });
      await source.click();
      const guide = student.getByRole("dialog", {
        name: text.guide,
        exact: true,
      });
      await expect(guide).toBeVisible();
      await expect(student).toHaveURL(classPath);
      await student.keyboard.press("Escape");
      await expect(guide).toHaveCount(0);
      await expect(source).toBeFocused();
      const native = await newDevice(browser, locale, {
        javaScriptEnabled: false,
        storageState: await student.context().storageState(),
      });
      try {
        await native.goto(classPath);
        const nativeSource = native.getByRole("link", {
          name: new RegExp(text.guide),
        });
        await nativeSource.click();
        await returnFromLesson(native, {
          lesson: text.guide,
          back: flow.back,
          address: `${classPath}#home-price-guide`,
          source: nativeSource,
        });
      } finally {
        await native.context().close();
      }
    } finally {
      await student.context().close();
    }
  });
}
