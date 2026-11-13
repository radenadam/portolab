import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { baseLocale, locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import routes from "../app/routes.ts";
import { runAccountCommand, submitSignIn, uniqueUsername } from "./accounts.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import type { BrowserProjectName } from "./browser-projects.ts";
import { chooseLanguage } from "./choose-language.ts";
import { readTestClass } from "./create-test-class.ts";
import { layoutProblems } from "./expect-layout.ts";
import type { LayoutRule } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

/** Who opens a page: a visitor who is not signed in, the lecturer of the class, its student, or a lecturer who has not finished the account yet. */
type Reader = "visitor" | "lecturer" | "student" | "newLecturer";

/** The addresses of the class of the walk, which a page builds its address from. */
interface WalkedClass {
  classPath: string;
  studentPath: string;
  joinPath: string;
}

/** A page of a route as one reader sees it. */
interface RoutePage {
  reader: Reader;
  path: (walked: WalkedClass) => string;
  /** The rules of the layout that a page of Tenang breaks until the piece of issue #127 that rebuilds it, which removes them here. */
  brokenUntilRebuilt?: readonly LayoutRule[];
}

// Each route of app/routes.ts, by its module, with the pages that the walk opens. The data of the walk has the widest content, so each page shows it at its widest.
const routePages: Record<string, readonly RoutePage[]> = {
  "features/home/home-page.tsx": [{ reader: "visitor", path: () => "/" }],
  "features/market-data/prices-page.tsx": [
    { reader: "visitor", path: () => "/prices" },
  ],
  "features/accounts/sign-in-page.tsx": [
    { reader: "visitor", path: () => "/sign-in" },
  ],
  "features/accounts/sign-out-page.tsx": [
    { reader: "student", path: () => "/sign-out" },
  ],
  "features/accounts/account-page.tsx": [
    { reader: "student", path: () => "/account" },
  ],
  "features/accounts/account-setup-page.tsx": [
    { reader: "newLecturer", path: () => "/account/setup" },
  ],
  "features/accounts/privacy-page.tsx": [
    { reader: "visitor", path: () => "/privacy" },
  ],
  "features/classes/classes-page.tsx": [
    { reader: "lecturer", path: () => "/classes" },
  ],
  "features/classes/class-page.tsx": [
    { reader: "lecturer", path: ({ classPath }) => classPath },
    { reader: "student", path: ({ classPath }) => classPath },
  ],
  "features/classes/calendar-page.tsx": [
    { reader: "lecturer", path: ({ classPath }) => `${classPath}/calendar` },
  ],
  // Besides BBCA, the ticket shows PGAS, which has one of the longest names of a company, and HRTA and AMRT, whose sectors have the longest names in Bahasa Indonesia and in English.
  "features/trading/orders-page.tsx": [
    { reader: "student", path: ({ classPath }) => `${classPath}/orders` },
    ...["BBCA", "PGAS", "HRTA", "AMRT"].map((code): RoutePage => ({
      reader: "student",
      path: ({ classPath }) => `${classPath}/orders?code=${code}`,
    })),
  ],
  "features/trading/portfolio-page.tsx": [
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/portfolio`,
      // The portfolio of Tenang scrolls sideways at 768 pixels, which no browser test opened before this walk.
      brokenUntilRebuilt: ["width"],
    },
  ],
  "features/measures/measures-page.tsx": [
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/measures`,
      // Each table of closes and returns sizes its columns by its own cells.
      brokenUntilRebuilt: ["tables"],
    },
  ],
  "features/measures/stock-measures-page.tsx": [
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/measures/BBCA`,
      brokenUntilRebuilt: ["tables"],
    },
  ],
  "features/grading/class-portfolios-page.tsx": [
    {
      reader: "lecturer",
      path: ({ classPath }) => `${classPath}/portfolios`,
    },
  ],
  // The address downloads a workbook, which no browser shows.
  "features/grading/workbook-route.tsx": [],
  "features/grading/student-portfolio-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => `${studentPath}/portfolio`,
      brokenUntilRebuilt: ["width"],
    },
  ],
  "features/grading/student-measures-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => `${studentPath}/measures`,
      brokenUntilRebuilt: ["tables"],
    },
  ],
  "features/classes/reset-password-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => `${studentPath}/password`,
    },
  ],
  "features/classes/join-page.tsx": [
    { reader: "visitor", path: () => "/join" },
  ],
  "features/classes/join-class-page.tsx": [
    { reader: "visitor", path: ({ joinPath }) => joinPath },
  ],
  "features/language/language-page.tsx": [
    { reader: "visitor", path: () => "/language" },
  ],
  // The address answers the check of the health of the server, for machines.
  "features/health/health-route.ts": [],
  "not-found-page.tsx": [
    { reader: "visitor", path: () => "/a-page-that-does-not-exist" },
  ],
};

// The phone project walks the widths of phones and the desktop project the widths of tablets, laptops, and screens, up to a screen of 2560 pixels. Decision 0028 sets the widths at which the layout changes, and these lie on both sides of each.
const widthsOfProject: Record<BrowserProjectName, readonly number[]> = {
  phone: [360, 390],
  desktop: [768, 1024, 1280, 1440, 1920, 2560],
};

// Text differs in length between the languages, so the narrowest phone and the width of the desktop references walk both, and the other widths walk the language of the references.
const widthsInEveryLanguage = [360, 1440];

// The walk opens every page of the app in each language of its width, which takes several times as long as a test of one flow.
const walkTimeoutMilliseconds = 180_000;

test("lists every route of app/routes.ts", () => {
  expect(Object.keys(routePages).sort()).toEqual(
    routes.map((route) => route.file).sort(),
  );
});

// Beside the holding of BBCA, the portfolio of the walk holds PGAS, which has one of the longest names of a company, with 35 characters, and AMMN, whose name holds the longest word, "Internasional". Each is 100 shares bought at the close of 29 October 2026 with the broker fee of 0.15%, PGAS at Rp1,215 for Rp121,682 and AMMN at Rp3,740 for Rp374,561, as the decimal module of Python computed with ROUND_HALF_UP. They leave Rp505,258,503,757 of the cash that the purchase of BBCA left.
const widestNameHoldings = [
  { code: "PGAS", shares: shares(100), cost: rupiah(121_682) },
  { code: "AMMN", shares: shares(100), cost: rupiah(374_561) },
];
const walkedCash = rupiah(505_258_503_757);

/** Creates the class of the walk with the widest names, the most starting cash, a student who holds BBCA, PGAS, and AMMN, and a lecturer who has not finished the account yet, and returns the page of each reader. */
async function walkedReaders(
  page: Page,
  browser: Browser,
): Promise<{ readers: Record<Reader, Page>; walked: WalkedClass }> {
  const { student, classId, classPath } = await studentOfNewClass(
    page,
    browser,
    { locale: baseLocale, ...widestClassNames },
  );
  storeTestHolding(
    classId,
    { ...bbcaHolding, cash: walkedCash },
    widestNameHoldings,
  );
  await page.goto(classPath);
  const { joinPath } = await readTestClass(page);
  const resetLink = page.locator(`main a[href$="/password"]`).first();
  const studentPath = (await resetLink.getAttribute("href"))?.replace(
    /\/password$/,
    "",
  );
  if (studentPath === undefined) {
    throw new Error("The page of the class links to no reset of a password.");
  }
  const visitor = await newDevice(browser, baseLocale);
  const newLecturer = await newDevice(browser, baseLocale);
  const username = uniqueUsername("dosen");
  await newLecturer.goto("/sign-in");
  await submitSignIn(
    newLecturer,
    username,
    runAccountCommand("create-lecturer", username),
  );
  await expect(newLecturer).toHaveURL(/\/account\/setup/);
  return {
    readers: { visitor, lecturer: page, student, newLecturer },
    walked: { classPath, studentPath, joinPath },
  };
}

for (const [project, widths] of Object.entries(widthsOfProject)) {
  for (const width of widths) {
    test(`keeps the layout of every page at ${String(width)} pixels`, async ({
      page,
      browser,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== project,
        `The ${project} project walks this width.`,
      );
      test.setTimeout(walkTimeoutMilliseconds);
      const { readers, walked } = await walkedReaders(page, browser);
      const walkedLocales: readonly Locale[] = widthsInEveryLanguage.includes(
        width,
      )
        ? locales
        : [baseLocale];
      const problems: string[] = [];
      for (const locale of walkedLocales) {
        for (const reader of Object.values(readers)) {
          await chooseLanguage(reader, locale);
          await reader.setViewportSize({ width, height: 900 });
        }
        for (const { reader, path, brokenUntilRebuilt = [] } of Object.values(
          routePages,
        ).flat()) {
          const address = path(walked);
          await readers[reader].goto(address);
          const found = await layoutProblems(readers[reader]);
          problems.push(
            ...found
              .filter(({ rule }) => !brokenUntilRebuilt.includes(rule))
              .map(({ text }) => `${locale} ${address}: ${text}`),
          );
        }
      }
      expect(problems).toEqual([]);
    });
  }
}
