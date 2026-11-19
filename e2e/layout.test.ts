import { screenshotFullHeight } from "./screenshot-full-height.ts";
import { expect, test } from "@playwright/test";
import type { Browser, Page, TestInfo } from "@playwright/test";
import { baseLocale, locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import routes from "../app/routes.ts";
import type { RouteConfigEntry } from "@react-router/dev/routes";
import { runAccountCommand, submitSignIn, uniqueUsername } from "./accounts.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import type { BrowserProjectName } from "./browser-projects.ts";
import { chooseLanguage } from "./choose-language.ts";
import { readTestClass } from "./create-test-class.ts";
import { layoutProblems, openingFocusProblems } from "./expect-layout.ts";
import type { LayoutRule } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import {
  widestClassNames,
  widestDigitClassNames,
} from "./widest-class-names.ts";
import { lessonSessionsForTest } from "./lesson-sessions-for-test.ts";

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
  /** A form or a page of prose must mark its centered reading column, so omitting the mark cannot skip that rule. */
  reading?: boolean;
  /** The rules of the layout that a page of Tenang breaks until the piece of issue #127 that rebuilds it removes them here. The comment of the entry names that piece. */
  brokenUntilRebuilt?: readonly LayoutRule[];
}

// Each route of app/routes.ts, by its module, with the pages that the walk opens. The data of the walk has the widest content, so each page shows it at its widest.
const routePages: Record<string, readonly RoutePage[]> = {
  // Stars submit here, and GET shows the shared not-found page.
  "features/watchlist/watchlist-page.tsx": [],
  // The layout has no address of its own, and every class page below renders it.
  "features/learning/learning-overlay.tsx": [],
  "features/learning/learn-page.tsx": [
    { reader: "student", path: ({ classPath }) => `${classPath}/learn` },
  ],
  "features/learning/price-guide-page.tsx": [
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/learn/prices`,
      reading: true,
    },
  ],
  "features/learning/lesson-page.tsx": lessonSessionsForTest.map(
    (session): RoutePage => ({
      reader: "student",
      path: ({ classPath }) => `${classPath}/learn/${String(session)}`,
    }),
  ),
  "features/learning/glossary-page.tsx": [
    { reader: "student", path: ({ classPath }) => `${classPath}/glossary` },
  ],
  "features/home/home-page.tsx": [{ reader: "visitor", path: () => "/" }],
  "features/market-data/market-page.tsx": [
    { reader: "student", path: ({ classPath }) => `${classPath}/market` },
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/market?view=map`,
    },
  ],
  "features/accounts/sign-in-page.tsx": [
    { reader: "visitor", path: () => "/sign-in", reading: true },
  ],
  "features/accounts/sign-out-page.tsx": [
    { reader: "student", path: () => "/sign-out", reading: true },
  ],
  "features/accounts/account-page.tsx": [
    { reader: "student", path: () => "/account", reading: true },
  ],
  "features/accounts/account-setup-page.tsx": [
    { reader: "newLecturer", path: () => "/account/setup", reading: true },
  ],
  "features/accounts/privacy-page.tsx": [
    { reader: "visitor", path: () => "/privacy", reading: true },
  ],
  "features/learning/guide-page.tsx": [
    { reader: "lecturer", path: () => "/guide", reading: true },
  ],
  "features/classes/classes-page.tsx": [
    { reader: "lecturer", path: () => "/classes", reading: true },
    { reader: "student", path: () => "/classes", reading: true },
  ],
  "features/classes/class-page.tsx": [
    { reader: "lecturer", path: ({ classPath }) => classPath },
    { reader: "student", path: ({ classPath }) => classPath },
  ],
  "features/classes/calendar-page.tsx": [
    { reader: "lecturer", path: ({ classPath }) => `${classPath}/calendar` },
  ],
  "features/trading/ticket-page.tsx": [
    ...["BBCA", "PGAS", "HRTA", "AMRT"].map((code): RoutePage => ({
      reader: "student",
      path: ({ classPath }) => `${classPath}/stocks/${code}/buy`,
    })),
  ],
  "features/trading/demonstration-page.tsx": [
    {
      reader: "lecturer",
      path: ({ classPath }) => `${classPath}/demonstration`,
    },
  ],
  "features/trading/demonstration-summary-page.tsx": [],
  "features/trading/demonstration-activity-page.tsx": [
    {
      reader: "lecturer",
      path: ({ classPath }) => `${classPath}/demonstration/activity`,
    },
  ],
  "features/measures/demonstration-analysis-page.tsx": [
    {
      reader: "lecturer",
      path: ({ classPath }) => `${classPath}/demonstration/analysis`,
    },
  ],
  "features/trading/activity-page.tsx": [
    { reader: "student", path: ({ classPath }) => `${classPath}/activity` },
  ],
  "features/measures/measures-page.tsx": [
    {
      reader: "student",
      path: ({ classPath }) => `${classPath}/analysis`,
    },
  ],
  "features/market-data/stock-page.tsx": [
    // The stock heading needs the same widest company names and sectors as the ticket.
    ...["BBCA", "PGAS", "HRTA", "AMRT"].map((code): RoutePage => ({
      reader: "student",
      path: ({ classPath }) => `${classPath}/stocks/${code}`,
    })),
  ],
  "features/grading/class-portfolios-page.tsx": [
    {
      reader: "lecturer",
      path: ({ classPath }) => `${classPath}/students`,
    },
  ],
  // The address downloads a workbook, which no browser shows.
  "features/grading/workbook-route.tsx": [],
  "features/grading/student-portfolio-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => studentPath,
    },
  ],
  "features/grading/student-measures-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => `${studentPath}/analysis`,
    },
  ],
  "features/grading/student-journal-page.tsx": [
    { reader: "lecturer", path: ({ studentPath }) => `${studentPath}/journal` },
  ],
  "features/classes/reset-password-page.tsx": [
    {
      reader: "lecturer",
      path: ({ studentPath }) => `${studentPath}/password`,
      reading: true,
    },
  ],
  "features/classes/join-page.tsx": [
    { reader: "visitor", path: () => "/join", reading: true },
  ],
  "features/classes/join-class-page.tsx": [
    { reader: "visitor", path: ({ joinPath }) => joinPath, reading: true },
    { reader: "visitor", path: () => "/join/invalid", reading: true },
  ],
  "features/theme/theme-page.tsx": [
    { reader: "visitor", path: () => "/theme", reading: true },
  ],
  "features/language/language-page.tsx": [
    { reader: "visitor", path: () => "/language", reading: true },
  ],
  // The address answers the check of the health of the server, for machines.
  "features/health/health-route.ts": [],
  "not-found-page.tsx": [
    {
      reader: "visitor",
      path: () => "/a-page-that-does-not-exist",
      reading: true,
    },
  ],
};

// The phone project walks the widths of phones and the desktop project the widths of tablets, laptops, and screens, up to a screen of 2560 pixels. Decision 0028 sets the widths at which the layout changes, and these lie on both sides of each.
const widthsOfProject: Record<BrowserProjectName, readonly number[]> = {
  phone: [360, 390],
  desktop: [768, 1024, 1280, 1440, 1920, 2560],
};

// The widths used for visual review walk both languages, because their text differs in length.
const widthsInEveryLanguage = [360, 1440, 1920];

// The walk opens every page of the app in each language of its width, which takes several times as long as a test of one flow.
const walkTimeoutMilliseconds = 180_000;

test("lists every route of app/routes.ts", () => {
  expect(Object.keys(routePages).sort()).toEqual(routeFiles(routes).sort());
});

function routeFiles(entries: readonly RouteConfigEntry[]): string[] {
  const files: string[] = [];
  for (const entry of entries) {
    files.push(entry.file);
    if (entry.children !== undefined) files.push(...routeFiles(entry.children));
  }
  return files;
}

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
  names: typeof widestClassNames,
): Promise<{ readers: Record<Reader, Page>; walked: WalkedClass }> {
  const { student, classId, classPath } = await studentOfNewClass(
    page,
    browser,
    { locale: baseLocale, ...names },
  );
  storeTestHolding(
    classId,
    { ...bbcaHolding, cash: walkedCash },
    widestNameHoldings,
  );
  await student.goto(`${classPath}/market`);
  await student
    .getByRole("button", { name: "Tambah BBCA ke pantauan", exact: true })
    .click();
  await expect(
    student.getByRole("region", { name: "Pantauan Anda" }),
  ).toBeVisible();
  await page.goto(classPath);
  const { joinPath } = await readTestClass(page);
  await page.goto(`${classPath}/students`);
  const studentAddress = await page
    .locator("main tbody tr")
    .first()
    .getByRole("link")
    .getAttribute("href");
  if (studentAddress === null) {
    throw new Error("Mahasiswa links to no page of a student.");
  }
  const studentPath = new URL(studentAddress, page.url()).pathname;
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

async function inspectScreen(
  page: Page,
  screen: {
    screen: number;
    locale: Locale;
    width: number;
    address: string;
    brokenUntilRebuilt: readonly LayoutRule[];
  },
  testInfo: TestInfo,
): Promise<string[]> {
  const problems = (await openingFocusProblems(page)).map(
    ({ text }) => `${screen.locale} ${screen.address}: ${text}`,
  );
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    const found = await layoutProblems(page);
    problems.push(
      ...found
        .filter(({ rule }) => !screen.brokenUntilRebuilt.includes(rule))
        .map(
          ({ text }) =>
            `${screen.locale} ${colorScheme} ${screen.address}: ${text}`,
        ),
    );
    if (widthsInEveryLanguage.includes(screen.width))
      await screenshotFullHeight(page, {
        path: testInfo.outputPath(
          `layout-${String(screen.screen)}-${screen.locale}-${String(screen.width)}-${colorScheme}.png`,
        ),
      });
  }
  return problems;
}

for (const [project, widths] of Object.entries(widthsOfProject)) {
  for (const width of widths) {
    const namesAtWidth =
      width === 360
        ? { letters: widestClassNames, digits: widestDigitClassNames }
        : { letters: widestClassNames };
    for (const [nameKind, names] of Object.entries(namesAtWidth)) {
      test(`keeps the layout of every page at ${String(width)} pixels with ${nameKind}`, async ({
        page,
        browser,
      }, testInfo) => {
        test.skip(
          testInfo.project.name !== project,
          `The ${project} project walks this width.`,
        );
        test.setTimeout(walkTimeoutMilliseconds);
        const { readers, walked } = await walkedReaders(page, browser, names);
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
          for (const [
            screen,
            { reader, path, reading, brokenUntilRebuilt = [] },
          ] of Object.values(routePages).flat().entries()) {
            const address = path(walked);
            await readers[reader].goto(address);
            if (reading === true) {
              await expect(
                readers[reader].locator('main [data-layout="reading"]'),
                address,
              ).toHaveCount(1);
            }
            problems.push(
              ...(await inspectScreen(
                readers[reader],
                { screen, locale, width, address, brokenUntilRebuilt },
                testInfo,
              )),
            );
          }
        }
        expect(problems).toEqual([]);
      });
    }
  }
}
