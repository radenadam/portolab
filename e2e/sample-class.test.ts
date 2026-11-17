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
  { sample: string; classTitle: string; studentTitle: string; demo: string }
> = {
  id: {
    sample: "Data contoh",
    classTitle: "Manajemen Portofolio Contoh",
    studentTitle: "Nilai portofolio",
    demo: "Portofolio demonstrasi",
  },
  en: {
    sample: "sample class",
    classTitle: "Manajemen Portofolio Contoh",
    studentTitle: "Portfolio value",
    demo: "Demonstration portfolio",
  },
};

for (const locale of locales) {
  test(`signs into the sample database as both roles in ${languageNames[locale]}`, async ({
    sample,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
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
        await expectAccessibleScreen(reader);
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
