import { expectAnalysisPanels } from "./expect-analysis-panels.ts";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test as base } from "@playwright/test";
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
import { openProfileMenu } from "./frame.ts";
import { captureScreens } from "./capture-screens.ts";
import { startTestServer } from "./start-test-server.ts";
import { newDevice } from "./new-device.ts";
import { languageNames } from "../app/language-names.ts";
import { parseSampleCredentialsForTest } from "../scripts/parse-sample-credentials-for-test.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";

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

const test = base.extend<{ sample: { url: string; output: string } }>({
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
      stop = await startTestServer({ databasePath, port });
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
  },
  en: {
    sample: "sample class",
    dayHelp: "What is Day range?",
    classTitle: "Manajemen Portofolio Contoh",
    studentTitle: "Portfolio value",
    demo: "Demonstration portfolio",
    mapTitle: "LQ45 stock map",
    own: "Your portfolio",
  },
};

for (const locale of locales) {
  test(`signs into the sample database as both roles in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }, testInfo) => {
    const credentials = successValueForTest(
      parseSampleCredentialsForTest(sample.output, "The sample command output"),
      "The sample command prints both roles",
    );
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
        await captureScreens(reader, testInfo, {
          name: `sample-${role}-${locale}`,
          fullPage: true,
          fromTop: true,
        });
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
}
