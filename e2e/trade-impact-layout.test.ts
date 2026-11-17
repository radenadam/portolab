import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import type { LayoutRule } from "./expect-layout.ts";
import { tradeImpactStudent } from "./trade-impact-student.ts";

for (const locale of locales) {
  for (const kind of ["stock", "ticket"] as const) {
    test(`keeps the ${kind} impact accessible and within its layout in ${languageNames[locale]}`, async ({
      page,
      browser,
    }, testInfo) => {
      const { student, classPath } = await tradeImpactStudent(page, browser, {
        locale,
        kind: "diversified",
      });
      await student.goto(
        `${classPath}/stocks/BBCA${kind === "ticket" ? "/buy?lots=10" : ""}`,
      );
      if (kind === "ticket") {
        await expect(
          student.locator('dialog form[data-ticket-ready="true"]'),
        ).toBeVisible();
      }
      const layouts: Record<typeof kind, LayoutRule> = {
        stock: "content",
        ticket: "columns",
      };
      // The frame's marker cannot check a nested stock wrapper.
      await expect(
        student.locator("#impact").locator("..").locator(".."),
      ).toHaveAttribute("data-layout", layouts[kind]);
      await expectImpactLayout(student, testInfo);
      await expectAccessibleScreen(student);
      await student.context().close();
    });
  }
}

async function expectImpactLayout(page: Page, testInfo: TestInfo) {
  const viewports = testInfo.project.name === "phone" ? [360] : [1440, 1920];
  for (const width of viewports) {
    for (const theme of ["light", "dark"] as const) {
      await page.setViewportSize({ width, height: 740 });
      await page.emulateMedia({ colorScheme: theme });
      expect(await layoutProblems(page)).toEqual([]);
    }
  }
}
