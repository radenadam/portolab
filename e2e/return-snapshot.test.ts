import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { chosenPassword, signInAndReturn } from "./accounts.ts";
import { captureScreens } from "./capture-screens.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { returnSnapshotServer } from "./return-snapshot-server.ts";

const texts: Record<
  Locale,
  {
    home: string;
    value: string;
    lead: string;
    portfolio: string;
    portfolioName: string;
    table: string;
    pointTime: string;
    market: string;
    point: string;
    timeChart: string;
    performance: string;
    classHeadline: string;
  }
> = {
  id: {
    home: "Sejak 30 Okt",
    value: "Rp 97.050.600",
    lead: "Unggul 0,07 poin dari IHSG",
    portfolio: "-2,95%",
    portfolioName: "Portofolio Anda",
    table: "Imbal hasil dari waktu ke waktu",
    pointTime: "3 Nov 2026, 10.00 WIB",
    market: "-3,02%",
    point: "3 Nov 2026, 10.00 WIB: Portofolio Anda -2,95% dan IHSG -3,02%",
    timeChart: "Grafik waktu",
    performance: "Kinerja vs IHSG",
    classHeadline: "Kelas unggul 0,07 poin dari IHSG",
  },
  en: {
    home: "Since Oct 30",
    value: "IDR 97,050,600",
    lead: "Ahead of the IHSG by 0.07 points",
    portfolio: "-2.95%",
    portfolioName: "Your portfolio",
    table: "Returns over time",
    pointTime: "Nov 3, 2026, 10:00 AM WIB",
    market: "-3.02%",
    point: "Nov 3, 2026, 10:00 AM WIB: Your portfolio -2.95% and IHSG -3.02%",
    timeChart: "Time chart",
    performance: "Performance vs IHSG",
    classHeadline: "Class leads IHSG by 0.07 points",
  },
};

// Python Decimal gives 250,600 + 20,000 * 4,840 = 97,050,600, a return of -0.029494. IHSG is 4,904.29 / 5,057.05 - 1 = -0.0302073343154605946, so the portfolio leads by 0.07133343154605946 percentage points. The preceding close leaves 99,850,600 after the purchase fee, which differs from this snapshot.
for (const locale of locales) {
  test(`keeps every portfolio screen at its newer quote snapshot in ${languageNames[locale]}`, async ({
    browser,
  }, testInfo) => {
    const server = await returnSnapshotServer();
    const text = texts[locale];
    expect(server.latestClose).toBe("2026-11-02");
    expect(server.measuredAt.toISOString()).toBe("2026-11-03T03:00:00.000Z");
    const devices: Page[] = [];
    try {
      const student = await newDevice(browser, locale, { siteUrl: server.url });
      devices.push(student);
      const lecturer = await newDevice(browser, locale, {
        siteUrl: server.url,
      });
      devices.push(lecturer);
      await student.goto(server.classPath);
      await lecturer.goto(server.classPath);
      await signInAndReturn(student, {
        path: server.classPath,
        username: server.studentUsername,
        password: chosenPassword,
      });
      await signInAndReturn(lecturer, {
        path: server.classPath,
        username: server.lecturerUsername,
        password: chosenPassword,
      });
      for (const [page, path, name] of [
        [student, server.classPath, "beranda"],
        [lecturer, `${server.classPath}/demonstration`, "demonstration"],
      ] as const) {
        await page.goto(path);
        await expect(page.getByRole("main")).toContainText(text.value);
        const card = page.locator("section").filter({
          has: page.getByRole("heading", { name: text.home, exact: true }),
        });
        await expect(card).toContainText(text.lead);
        const chart = card.getByRole("slider");
        await expectSnapshot(chart, text);
        const details = card.locator("details");
        await details.getByText(text.table, { exact: true }).click();
        const endpoint = details.locator("tbody tr").last();
        await expect(endpoint.getByRole("rowheader")).toHaveText(
          text.pointTime,
        );
        await expect(endpoint).toContainText(text.portfolio);
        await expect(endpoint).toContainText(text.market);
        expect(await layoutProblems(page)).toEqual([]);
        await details.getByText(text.table, { exact: true }).click();
        const own = page.locator('[data-map-label="point"]').filter({
          hasText: text.portfolioName,
        });
        await expect(own).toBeVisible();
        const mapSlider = page
          .locator('section[aria-labelledby="home-map-heading"]')
          .getByRole("slider");
        await mapSlider.focus();
        await mapSlider.press("Escape");
        await expect
          .poll(() => mapSlider.getAttribute("aria-valuetext"))
          .toContain(text.portfolioName);
        await expect
          .poll(() => mapSlider.getAttribute("aria-valuetext"))
          .toContain(text.portfolio);
        if (testInfo.project.name === "desktop") {
          // The recorded quote of 4,840 is the month's minimum, so its endpoint is at the bottom by hand.
          const sparkline = page
            .getByRole("row")
            .filter({ hasText: "BBCA" })
            .locator("td")
            .last();
          await expect(sparkline.locator("circle")).toHaveAttribute(
            "cx",
            "100%",
          );
          await expect(sparkline.locator("circle")).toHaveAttribute(
            "cy",
            "100%",
          );
        }
        await expectAccessibleScreen(page);
        await captureScreens(page, testInfo, {
          name: `${name}-${locale}`,
          fullPage: true,
          fromTop: true,
          check: async () => {
            expect(await layoutProblems(page)).toEqual([]);
          },
        });
        await page
          .getByRole("link", { name: text.timeChart, exact: true })
          .click();
        await expectSnapshot(
          page
            .locator('section[aria-labelledby="home-map-heading"]')
            .getByRole("slider"),
          text,
        );
        await page.goto(`${path}/analysis`);
        const performance = page.getByRole("region", {
          name: text.performance,
        });
        await expect(performance).toContainText(text.lead);
        await expectSnapshot(performance.getByRole("slider"), text);
        await captureScreens(page, testInfo, {
          name: `${name}-analysis-${locale}`,
          fullPage: true,
          fromTop: true,
          check: async () => {
            expect(await layoutProblems(page)).toEqual([]);
          },
        });
      }
      await lecturer.goto(server.classPath);
      await expect(
        lecturer.getByRole("heading", {
          name: text.classHeadline,
          exact: true,
        }),
      ).toBeVisible();
      await expect(lecturer.getByRole("main")).toContainText(text.portfolio);
      await expect
        .poll(() =>
          lecturer
            .locator('section[aria-labelledby="class-map-heading"]')
            .getByRole("slider")
            .getAttribute("aria-valuetext"),
        )
        .toContain(text.market);
      await captureScreens(lecturer, testInfo, {
        name: `kelas-${locale}`,
        fullPage: true,
        fromTop: true,
      });
    } finally {
      try {
        for (const device of devices) await device.context().close();
      } finally {
        await server.stop();
      }
    }
  });
}

async function expectSnapshot(
  chart: Locator,
  text: (typeof texts)[Locale],
): Promise<void> {
  await expect(chart).toHaveAttribute("aria-valuetext", text.point);
}
