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
import { recordedMarketServer } from "./recorded-market-server.ts";

const texts: Record<
  Locale,
  {
    home: string;
    value: string;
    lead: string;
    portfolio: string;
    portfolioName: string;
    studentPortfolioName: (name: string) => string;
    studentPoint: (name: string) => string;
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
    studentPortfolioName: (name) => `Portofolio ${name}`,
    studentPoint: (name) =>
      `3 Nov 2026, 10.00 WIB: Portofolio ${name} -2,95% dan IHSG -3,02%`,
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
    studentPortfolioName: (name) => `Portfolio of ${name}`,
    studentPoint: (name) =>
      `Nov 3, 2026, 10:00 AM WIB: Portfolio of ${name} -2.95% and IHSG -3.02%`,
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
const screens = [
  { name: "beranda", identity: "owner", view: "summary" },
  { name: "analysis", identity: "owner", view: "analysis" },
  { name: "demonstration", identity: "demonstration", view: "summary" },
  {
    name: "demonstration-analysis",
    identity: "demonstration",
    view: "analysis",
  },
  { name: "kelas", identity: "class", view: "class" },
  { name: "student-view", identity: "student", view: "summary" },
  { name: "student-view-analysis", identity: "student", view: "analysis" },
] as const;

type SnapshotIdentity = (typeof screens)[number]["identity"];

for (const screen of screens) {
  for (const locale of locales) {
    test(`keeps ${screen.name} at its newer quote snapshot in ${languageNames[locale]}`, async ({
      browser,
    }, testInfo) => {
      const server = await recordedMarketServer();
      try {
        const text = texts[locale];
        expect(server.latestClose).toBe("2026-11-02");
        expect(server.measuredAt.toISOString()).toBe(
          "2026-11-03T03:00:00.000Z",
        );
        const usernames: Record<
          SnapshotIdentity,
          typeof server.studentUsername
        > = {
          owner: server.studentUsername,
          demonstration: server.lecturerUsername,
          class: server.lecturerUsername,
          student: server.lecturerUsername,
        };
        const page = await newDevice(browser, locale, { siteUrl: server.url });
        try {
          await page.goto(server.classPath);
          await signInAndReturn(page, {
            path: server.classPath,
            username: usernames[screen.identity],
            password: chosenPassword,
          });
          const path = await snapshotPath(page, server, screen.identity);
          await page.goto(
            screen.view === "analysis" ? `${path}/analysis` : path,
          );
          const portfolioName =
            screen.identity === "student"
              ? text.studentPortfolioName(server.studentName)
              : text.portfolioName;
          const point =
            screen.identity === "student"
              ? text.studentPoint(server.studentName)
              : text.point;
          switch (screen.view) {
            case "class": {
              await expect(
                page.getByRole("heading", {
                  name: text.classHeadline,
                  exact: true,
                }),
              ).toBeVisible();
              const map = classMap(page);
              await expect
                .poll(() => map.getAttribute("aria-valuetext"))
                .toContain(text.market);
              await map.focus();
              await map.press("Home");
              await expect
                .poll(() => map.getAttribute("aria-valuetext"))
                .toContain(server.studentName);
              await expect
                .poll(() => map.getAttribute("aria-valuetext"))
                .toContain(text.portfolio);
              await map.press("Escape");
              break;
            }
            case "summary":
              await expectSummarySnapshot(page, {
                text,
                portfolioName,
                point,
                projectName: testInfo.project.name,
              });
              break;
            case "analysis": {
              const performance = page.getByRole("region", {
                name: text.performance,
              });
              await expect(performance).toContainText(text.lead);
              await expectSnapshot(performance.getByRole("slider"), point);
              break;
            }
          }
          await expectAccessibleScreen(page);
          await captureScreens(page, testInfo, {
            name: `${screen.name}-${locale}`,
            fullPage: true,
            fromTop: true,
            check: async () => {
              expect(await layoutProblems(page)).toEqual([]);
            },
          });
          if (screen.view === "summary") {
            await page
              .getByRole("link", { name: text.timeChart, exact: true })
              .click();
            await expectSnapshot(
              page
                .locator('section[aria-labelledby="home-map-heading"]')
                .getByRole("slider"),
              point,
            );
          }
        } finally {
          await page.context().close();
        }
      } finally {
        await server.stop();
      }
    });
  }
}

async function expectSummarySnapshot(
  page: Page,
  {
    text,
    portfolioName,
    point,
    projectName,
  }: {
    text: (typeof texts)[Locale];
    portfolioName: string;
    point: string;
    projectName: string;
  },
): Promise<void> {
  await expect(page.getByRole("main")).toContainText(text.value);
  const card = page.locator("section").filter({
    has: page.getByRole("heading", {
      name: text.home,
      exact: true,
    }),
  });
  await expect(card).toContainText(text.lead);
  await expectSnapshot(card.getByRole("slider"), point);
  const details = card.locator("details");
  await details.getByText(text.table, { exact: true }).click();
  const endpoint = details.locator("tbody tr").last();
  await expect(endpoint.getByRole("rowheader")).toHaveText(text.pointTime);
  await expect(endpoint).toContainText(text.portfolio);
  await expect(endpoint).toContainText(text.market);
  expect(await layoutProblems(page)).toEqual([]);
  await details.getByText(text.table, { exact: true }).click();
  const own = page.locator('[data-map-label="point"]').filter({
    hasText: portfolioName,
  });
  await expect(own).toBeVisible();
  const map = page
    .locator('section[aria-labelledby="home-map-heading"]')
    .getByRole("slider");
  await map.focus();
  await map.press("Escape");
  await expect
    .poll(() => map.getAttribute("aria-valuetext"))
    .toContain(portfolioName);
  await expect
    .poll(() => map.getAttribute("aria-valuetext"))
    .toContain(text.portfolio);
  if (projectName === "desktop") {
    // The recorded quote of 4,840 is the month's minimum, so its endpoint is at the bottom by hand.
    const sparkline = page
      .getByRole("row")
      .filter({ hasText: "BBCA" })
      .locator("td")
      .last();
    await expect(sparkline.locator("circle")).toHaveAttribute("cx", "100%");
    await expect(sparkline.locator("circle")).toHaveAttribute("cy", "100%");
  }
}

async function snapshotPath(
  page: Page,
  server: Awaited<ReturnType<typeof recordedMarketServer>>,
  identity: SnapshotIdentity,
): Promise<string> {
  switch (identity) {
    case "owner":
    case "class":
      return server.classPath;
    case "demonstration":
      return `${server.classPath}/demonstration`;
    case "student": {
      const map = classMap(page);
      await map.focus();
      await map.press("Home");
      await map.press("Enter");
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: server.studentName,
          exact: true,
        }),
      ).toBeVisible();
      return new URL(page.url()).pathname;
    }
  }
}

function classMap(page: Page): Locator {
  return page
    .locator('section[aria-labelledby="class-map-heading"]')
    .getByRole("slider");
}

async function expectSnapshot(chart: Locator, point: string): Promise<void> {
  await expect(chart).toHaveAttribute("aria-valuetext", point);
}
