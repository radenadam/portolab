import { expectAnalysisPanels } from "./expect-analysis-panels.ts";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Role } from "../app/features/accounts/accounts.schema.ts";
import { tokenColor } from "./token-color.ts";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { saveSampleHistoryForTest } from "../app/features/sample-class/sample-prices-for-test.server.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { secondMilliseconds } from "../app/time-units.ts";
import { submitSignIn } from "./accounts.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { selectFirstStudent } from "./select-first-student.ts";
import { openProfileMenu } from "./frame.ts";
import { captureScreens } from "./capture-screens.ts";
import { startTestServer } from "./start-test-server.ts";
import { newDevice } from "./new-device.ts";
import { languageNames } from "../app/language-names.ts";
import { parseSampleCredentialsForTest } from "../scripts/parse-sample-credentials-for-test.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { companyLogoForTest } from "../app/features/market-data/company-logo-for-test.ts";
import {
  companyLogoFileName,
  companyLogoPath,
} from "../app/features/market-data/company-logo-paths.ts";
import { expectCompanyLogo } from "./expect-company-logo.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { trackedStockCodes } from "../app/features/market-data/tracked-instruments.ts";
import { screenshotWidths } from "./screenshot-widths.ts";

const missingLogo = { code: "BBRI", letters: "BB" };

interface SampleSite {
  url: string;
  output: string;
}

function credentialsForSample(sample: SampleSite) {
  return successValueForTest(
    parseSampleCredentialsForTest(sample.output, "The sample command output"),
    "The sample command prints both roles",
  );
}

async function signInSample(
  reader: Page,
  sample: SampleSite,
  role: Role,
): Promise<void> {
  const credentials = credentialsForSample(sample)[role];
  await reader.goto(`${sample.url}/sign-in`);
  await submitSignIn(reader, credentials.username, credentials.password);
  await expect(reader).toHaveURL(`${sample.url}/classes/1`);
}

async function unusedPort(): Promise<number> {
  const reservation = createServer();
  await new Promise<void>((resolve) => {
    reservation.listen(0, "127.0.0.1", resolve);
  });
  const address = reservation.address();
  if (address === null || typeof address === "string")
    throw new Error("The sample test reserved no TCP port.");
  await new Promise<void>((resolve, reject) => {
    reservation.close((error) => {
      if (error === undefined) resolve();
      else reject(error);
    });
  });
  return address.port;
}

const test = base.extend<{ sample: SampleSite }>({
  sample: async ({ browserName }, use) => {
    const folder = mkdtempSync(
      join(tmpdir(), `portolab-sample-${browserName}-`),
    );
    let stop: (() => Promise<void>) | undefined;
    try {
      const databasePath = join(folder, "sample.sqlite");
      const database = openDatabase(
        databasePath,
        join(import.meta.dirname, "..", migrationsFolderName),
      );
      try {
        saveSampleHistoryForTest(database);
      } finally {
        closeDatabase(database);
      }
      const output = execFileSync(
        process.execPath,
        [join(import.meta.dirname, "sample-class-command-for-test.ts")],
        {
          cwd: tmpdir(),
          env: {
            ...process.env,
            DATABASE_PATH: databasePath,
            PRICE_SOURCE: "fixture",
          },
          encoding: "utf8",
          timeout: 30 * secondMilliseconds,
        },
      );
      const port = await unusedPort();
      const companyLogosPath = join(folder, "generated-tiles");
      mkdirSync(companyLogosPath);
      for (const code of trackedStockCodes) {
        if (code !== missingLogo.code)
          writeFileSync(
            join(companyLogosPath, companyLogoFileName(code)),
            companyLogoForTest(code === "TLKM" ? "wide" : "square"),
          );
      }
      stop = await startTestServer({ databasePath, port, companyLogosPath });
      await use({ url: `http://localhost:${String(port)}`, output });
    } finally {
      await stop?.();
      rmSync(folder, { recursive: true, force: true });
    }
  },
});

const texts: Record<
  Locale,
  {
    sample: string;
    classTitle: string;
    studentTitle: string;
    demo: string;
    dayHelp: string;
    mapTitle: string;
    own: string;
    watchlist: string;
    remove: string;
  }
> = {
  id: {
    sample: "Data contoh",
    dayHelp: "Apa itu Rentang harian?",
    classTitle: "Manajemen Portofolio Contoh",
    studentTitle: "Nilai portofolio",
    demo: "Portofolio demonstrasi",
    mapTitle: "Peta saham LQ45",
    own: "Portofolio Anda",
    watchlist: "Pantauan Anda",
    remove: "Hapus BBCA dari pantauan",
  },
  en: {
    sample: "sample class",
    dayHelp: "What is Day range?",
    classTitle: "Manajemen Portofolio Contoh",
    studentTitle: "Portfolio value",
    demo: "Demonstration portfolio",
    mapTitle: "LQ45 stock map",
    own: "Your portfolio",
    watchlist: "Your watchlist",
    remove: "Remove BBCA from your watchlist",
  },
};

for (const locale of locales) {
  test(`signs into the sample database as both roles in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    const credentials = credentialsForSample(sample);
    for (const role of ["lecturer", "student"] as const) {
      const { username, password } = credentials[role];
      const reader = await newDevice(browser, locale, { siteUrl: sample.url });
      try {
        await reader.goto(`${sample.url}/sign-in`);
        await expect(
          reader.getByText(texts[locale].sample, { exact: true }),
        ).toBeVisible();
        await submitSignIn(reader, username, password);
        await expect(reader).toHaveURL(`${sample.url}/classes/1`);
        await expect(
          reader.getByText(texts[locale].sample, { exact: true }),
        ).toBeVisible();
        if (role === "lecturer") {
          await expect(
            reader
              .getByRole("banner")
              .locator('button[popovertarget="class-switcher"]'),
          ).toContainText(texts[locale].classTitle);
          await reader.goto(`${sample.url}/classes/1/demonstration`);
          await expect(
            reader.getByRole("heading", {
              name: texts[locale].demo,
              exact: true,
            }),
          ).toBeVisible();
        } else
          await expect(
            reader.getByRole("heading", {
              name: texts[locale].studentTitle,
              exact: true,
            }),
          ).toBeVisible();
        for (const theme of ["dark", "system"] as const) {
          const profile = await openProfileMenu(reader);
          await profile
            .locator(`form[action="/theme"] button[value="${theme}"]`)
            .click();
          await expect(reader.locator("html")).toHaveAttribute(
            "data-theme",
            theme,
          );
          await reader.reload();
          await expect(reader.locator("html")).toHaveAttribute(
            "data-theme",
            theme,
          );
        }
        await expectAccessibleScreen(reader);
        for (const image of await reader
          .locator('img[src="/company-logos/BBCA.png"]:visible')
          .all())
          await expectCompanyLogo(image, "square");
        await captureScreens(reader, testInfo, {
          name: `sample-${role}-${locale}`,
          fullPage: true,
          fromTop: true,
        });
        await reader.goto(`${sample.url}/classes/1/learn/2`);
        await expect(reader.locator('input[type="range"]')).toHaveCount(2);
        if (role === "student")
          await expect(
            reader.locator("button[data-learning-pair]").first(),
          ).toBeVisible();
        await reader.goto(`${sample.url}/classes/1/learn/6`);
        await expect(
          reader.locator('a[href*="priceKind=limit"][href*="lessonTask=6"]'),
        ).toBeVisible();
        await expect(
          reader.locator("[data-learning-last-trade]"),
        ).toBeVisible();
        await reader.goto(`${sample.url}/classes/1/learn/prices`);
        await expect(
          reader.locator('a[href*="lessonTask=prices"]'),
        ).toBeVisible();
        await reader.goto(`${sample.url}/classes/1/stocks/BBCA`);
        const dayHelp = reader.getByRole("button", {
          name: texts[locale].dayHelp,
          exact: true,
        });
        await expect(dayHelp.locator("../..").getByRole("img")).toHaveCount(1);
        await dayHelp.click();
        await expect(
          reader.getByRole("dialog").getByText(/BBCA/),
        ).toBeVisible();
        await reader.keyboard.press("Escape");
        await reader.goto(`${sample.url}/classes/1/market`);
        const watchlist = reader.getByRole("region", {
          name: texts[locale].watchlist,
        });
        await expect(
          watchlist.getByRole("button", {
            name: texts[locale].remove,
            exact: true,
          }),
        ).toHaveAttribute("aria-pressed", "true");
        await expect(watchlist.locator("tbody tr")).toHaveCount(2);
        await captureScreens(reader, testInfo, {
          name: `sample-watchlist-${role}-${locale}`,
          fullPage: true,
          fromTop: true,
        });
        await reader.goto(`${sample.url}/classes/1/market?view=map`);
        const marketMap = reader.getByRole("region", {
          name: texts[locale].mapTitle,
        });
        await expect(marketMap.getByRole("slider")).toBeVisible();
        await expect(
          marketMap.locator('[data-map-label="point"]'),
        ).toContainText([texts[locale].own]);
        await captureScreens(reader, testInfo, {
          name: `sample-market-map-${role}-${locale}`,
          fullPage: true,
          fromTop: true,
        });
        await reader.goto(`${sample.url}/not-a-page`);
        await expect(
          reader.getByText(texts[locale].sample, { exact: true }),
        ).toBeVisible();
      } finally {
        await reader.context().close();
      }
    }
  });

  test(`shows the made-up NIM of every sample student to the lecturer in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }, testInfo) => {
    const reader = await newDevice(browser, locale, { siteUrl: sample.url });
    try {
      await signInSample(reader, sample, "lecturer");
      await reader.goto(`${sample.url}/classes/1/students`);
      const rows = reader.locator("main tbody tr");
      await expect(rows).toHaveCount(30);
      await expect(rows).toContainText(
        Array.from({ length: await rows.count() }, () => /CONTOH-\d+/),
      );
      await expectAccessibleScreen(reader);
      await captureScreens(reader, testInfo, {
        name: `sample-nim-students-${locale}`,
        fullPage: true,
        fromTop: true,
      });
      await selectFirstStudent(reader);
      await expect(reader.getByRole("dialog")).toContainText(/CONTOH-\d+/);
      await captureScreens(reader, testInfo, {
        name: `sample-nim-panel-${locale}`,
        fullPage: false,
        fromTop: true,
      });
    } finally {
      await reader.context().close();
    }
  });

  test(`shows every analysis panel of the sample class to both roles in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }, testInfo) => {
    for (const role of ["lecturer", "student"] as const) {
      const reader = await newDevice(browser, locale, { siteUrl: sample.url });
      try {
        await signInSample(reader, sample, role);
        await reader.goto(
          `${sample.url}/classes/1/${role === "lecturer" ? "demonstration/" : ""}analysis`,
        );
        await expectAnalysisPanels(reader, locale);
        await expect(
          reader.locator('button[popovertarget^="analysis-pair-"]').first(),
        ).toBeVisible();
        await expect(
          reader.locator('button[popovertarget^="analysis-risk-"]').first(),
        ).toBeVisible();
        await expectAccessibleScreen(reader);
        await captureScreens(reader, testInfo, {
          name: `sample-analysis-${role}-${locale}`,
          fullPage: true,
          fromTop: true,
        });
      } finally {
        await reader.context().close();
      }
    }
  });

  for (const [name, suffix, role] of [
    ["home", "", "student"],
    ["market", "/market", "student"],
    ["stock", "/stocks/BBCA", "student"],
    ["stock-ticket", "/stocks/BBCA/buy", "student"],
    ["ticket-done", "/stocks/BBCA/buy", "student"],
    ["activity", "/activity", "student"],
    ["student", "/students/2", "lecturer"],
    ["student-journal", "/students/2/journal", "lecturer"],
    ["demonstration-activity", "/demonstration/activity", "lecturer"],
  ] as const) {
    const widths: readonly (number | undefined)[] = [
      "stock",
      "stock-ticket",
      "ticket-done",
    ].includes(name)
      ? [...screenshotWidths("phone"), ...screenshotWidths("desktop")]
      : [undefined];
    for (const width of widths) {
      test.describe(`${name} at ${width === undefined ? "shared widths" : String(width)}`, () => {
        if (width !== undefined)
          test.skip(
            ({ isMobile }) =>
              isMobile !== (width === screenshotWidths("phone")[0]),
            "This reference width belongs to the other device project.",
          );
        test(`shows owner-supplied tiles on ${name} in the sample class in ${languageNames[locale]}`, async ({
          sample,
          browser,
        }, testInfo) => {
          const reader = await newDevice(browser, locale, {
            siteUrl: sample.url,
          });
          try {
            await signInSample(reader, sample, role);
            const errors: string[] = [];
            reader.on("pageerror", (error) => {
              errors.push(error.message);
            });
            await reader.goto(`${sample.url}/classes/1${suffix}`);
            if (name === "ticket-done") {
              await reader.locator('dialog button[type="submit"]').click();
              await expect(reader.getByRole("status")).toBeVisible();
            }
            const visibleContent =
              ["stock-ticket", "ticket-done"].includes(name) &&
              testInfo.project.name === "phone"
                ? reader.locator("dialog")
                : reader.locator("main");
            await expect(
              visibleContent
                .locator(
                  name === "demonstration-activity"
                    ? 'img[src^="/company-logos/"]:visible'
                    : 'img[src="/company-logos/BBCA.png"]:visible',
                )
                .first(),
            ).toBeVisible();
            await captureScreens(reader, testInfo, {
              name: `logos-${name}-${locale}`,
              width,
              fullPage:
                !["stock-ticket", "ticket-done"].includes(name) ||
                testInfo.project.name !== "phone",
              fromTop: true,
              check: async () => {
                for (const [code, shape] of [
                  ["BBCA", "square"],
                  ["TLKM", "wide"],
                ] as const) {
                  for (const image of await visibleContent
                    .locator(`img[src="${companyLogoPath(code)}"]:visible`)
                    .all())
                    await expectCompanyLogo(image, shape);
                }
              },
            });
            await expectAccessibleScreen(reader);
            expect(errors).toEqual([]);
          } finally {
            await reader.context().close();
          }
        });
      });
    }
  }

  test(`restores the native image fallback and serves only the owner tiles in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }) => {
    const reader = await newDevice(browser, locale, { siteUrl: sample.url });
    try {
      await signInSample(reader, sample, "student");
      await reader.route("**/company-logos/BBCA.png", async (route) => {
        await route.fulfill({ status: 404 });
      });
      await holdClientScripts(
        reader,
        { address: `${sample.url}/classes/1/stocks/BBCA` },
        async (loadClient) => {
          await expect
            .poll(() =>
              reader
                .locator('img[src="/company-logos/BBCA.png"]')
                .first()
                .evaluate(
                  (image) =>
                    image instanceof HTMLImageElement &&
                    image.complete &&
                    image.naturalWidth === 0,
                ),
            )
            .toBe(true);
          await loadClient();
          await expect(
            reader
              .locator("main header [aria-hidden=true]")
              .filter({ hasText: "BB" })
              .first(),
          ).toBeVisible();
          await expect(
            reader.locator('img[src="/company-logos/BBCA.png"]'),
          ).toHaveCount(0);
          await expect(
            reader
              .locator("main header [aria-hidden=true]")
              .filter({ hasText: "BB" })
              .first(),
          ).toHaveCSS(
            "background-color",
            await tokenColor(reader, "--color-raised"),
          );
        },
      );
      const image = await reader.request.get(
        `${sample.url}/company-logos/BBCA.png`,
      );
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toContain("image/png");
      expect(image.headers()["x-content-type-options"]).toBe("nosniff");
      expect(image.headers()["cache-control"]).toBe("no-cache");
      expect(await image.body()).toEqual(companyLogoForTest("square"));
      for (const path of [
        `${missingLogo.code}.png`,
        "unknown.png",
        "BBCA.svg",
        "",
        "%2e%2e%2fpackage.json",
      ]) {
        expect(
          (
            await reader.request.get(`${sample.url}/company-logos/${path}`)
          ).status(),
        ).toBe(404);
      }
    } finally {
      await reader.context().close();
    }
  });
  test(`shows supplied tiles and missing-file monograms before JavaScript loads in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }) => {
    const reader = await newDevice(browser, locale, {
      siteUrl: sample.url,
      javaScriptEnabled: false,
    });
    try {
      await signInSample(reader, sample, "student");
      await reader.goto(`${sample.url}/classes/1/market`);
      await expectCompanyLogo(
        reader.locator('img[src="/company-logos/BBCA.png"]').first(),
        "square",
      );
      await expectCompanyLogo(
        reader.locator('img[src="/company-logos/TLKM.png"]').first(),
        "wide",
      );
      const missingRows = await reader
        .getByRole("row", { name: new RegExp(missingLogo.code) })
        .all();
      expect(missingRows.length).toBeGreaterThan(0);
      for (const missing of missingRows) {
        await expect(
          missing.getByText(missingLogo.letters, { exact: true }),
        ).toHaveAttribute("aria-hidden", "true");
        await expect(missing.locator("img")).toHaveCount(0);
      }
    } finally {
      await reader.context().close();
    }
  });
}
