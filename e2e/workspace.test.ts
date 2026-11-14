import { expect, test } from "@playwright/test";
import type { Browser, Locator, Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { createClassPath } from "../app/features/classes/class-path.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  chosenPassword,
  signInAsNewLecturer,
  submitSignIn,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import type { TestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { expectTexts } from "./expect-texts.ts";
import {
  isPhone,
  openClassSwitcher,
  openProfileMenu,
  openSimulationCard,
} from "./frame.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

const texts: Record<
  Locale,
  {
    navigation: string;
    studentItems: readonly string[];
    lecturerItems: readonly string[];
    joinedClasses: string;
    taughtClasses: string;
    join: string;
    createClass: string;
    oneStudent: string;
    signOut: string;
    marketTitle: string;
    notFoundTitle: string;
    shortBadge: string;
    longBadge: string;
    cardTitle: string;
    simulation: string;
    latestPrice: string;
    missedPrices: readonly string[];
    lesson: string;
  }
> = {
  id: {
    navigation: "Navigasi utama",
    studentItems: ["Beranda", "Pasar", "Aktivitas", "Analisis"],
    lecturerItems: ["Kelas", "Mahasiswa", "Pasar"],
    joinedClasses: "Kelas Anda",
    taughtClasses: "Kelas yang Anda ajar",
    join: "Gabung ke kelas",
    createClass: "Buat kelas",
    oneStudent: "1 mahasiswa",
    signOut: "Keluar",
    marketTitle: "Pasar",
    notFoundTitle: "Halaman tidak ditemukan",
    shortBadge: "Simulasi · ±10 mnt",
    longBadge: "Simulasi · harga tertunda ±10 mnt",
    cardTitle: "Simulasi dan harga tertunda",
    simulation:
      "Uang di Portolab virtual, jadi setiap hasil adalah simulasi. Setiap harga adalah harga tertunda dari Yahoo Finance, sekitar 10 menit di belakang BEI.",
    latestPrice: "Harga terakhir tercatat pada 30 Okt 2026, 16.14 WIB.",
    lesson:
      "Pelajari lebih lanjut di sesi 6. Pelajaran belum tersedia di Portolab.",
    missedPrices: [
      "Portolab tidak dapat memperbarui harga UNVR pada ",
      " WIB, jadi Portolab memakai harga terakhir UNVR yang tersimpan. Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada ",
      " WIB gagal. Portolab ",
    ],
  },
  en: {
    navigation: "Main navigation",
    studentItems: ["Home", "Market", "Activity", "Analysis"],
    lecturerItems: ["Class", "Students", "Market"],
    joinedClasses: "Your classes",
    taughtClasses: "Classes you teach",
    join: "Join a class",
    createClass: "Create a class",
    oneStudent: "1 student",
    signOut: "Sign out",
    marketTitle: "Market",
    notFoundTitle: "Page not found",
    shortBadge: "Simulation · ±10 min",
    longBadge: "Simulation · prices delayed ±10 min",
    cardTitle: "Simulation and delayed prices",
    simulation:
      "The money in Portolab is virtual, so every result is a simulation. Every price is a delayed price from Yahoo Finance, about 10 minutes behind IDX.",
    latestPrice: "The latest price was quoted at Oct 30, 2026, 4:14 PM WIB.",
    lesson:
      "Learn more in session 6. The lesson is not available in Portolab yet.",
    missedPrices: [
      "Portolab could not update the price of UNVR at ",
      " WIB, so it uses the last price of UNVR that it stored. Portolab has no price for WIFI yet, because its latest attempt to fetch it at ",
      " WIB failed. Portolab ",
    ],
  },
};

const otherClassName = "Analisis Investasi C";

/** The items of the navigation that the screen shows, in the rail on a desktop and in the tab bar on a phone. */
function navigationItems(page: Page, locale: Locale): Locator {
  return page
    .getByRole("navigation", { name: texts[locale].navigation })
    .getByRole("listitem")
    .getByRole("link");
}

/** Checks the items of the navigation of a class, with the address of each and the one that is current. */
async function expectItems(
  page: Page,
  locale: Locale,
  {
    items,
    current,
  }: { items: readonly (readonly [string, string])[]; current: string },
): Promise<void> {
  const links = navigationItems(page, locale);
  await expect(links).toHaveText(items.map(([label]) => label));
  for (const [label, path] of items) {
    const link = links.filter({ hasText: label });
    await expect(link).toHaveAttribute("href", path);
    if (label === current) {
      await expect(link).toHaveAttribute("aria-current", "page");
    } else {
      await expect(link).not.toHaveAttribute("aria-current");
    }
  }
}

/** Signs the student of a page out through the menu of the profile, and then in again with the password of the tests, on the page to which signing out leads. */
async function signOutAndIn(
  page: Page,
  locale: Locale,
  username: string,
): Promise<void> {
  const menu = await openProfileMenu(page);
  await menu.getByRole("button", { name: texts[locale].signOut }).click();
  await expect(page).toHaveURL("/sign-in");
  await page.goto("/sign-in");
  await submitSignIn(page, username, chosenPassword);
}

/** A lecturer with two classes of the widest names and a student who joined the first and then the second, each on a device of their own. */
async function studentOfTwoClasses(
  page: Page,
  browser: Browser,
  locale: Locale,
): Promise<{
  student: Page;
  username: string;
  first: TestClass;
  second: TestClass;
}> {
  await chooseLanguage(page, locale);
  await signInAsNewLecturer(page, widestClassNames.lecturerName);
  const first = await createTestClass(page, widestClassNames.className);
  const second = await createTestClass(page, otherClassName);
  const student = await newDevice(browser, locale);
  const username = await signInAsTestStudent(
    student,
    first,
    widestClassNames.studentName,
  );
  await student.goto(second.joinPath);
  await student.getByRole("main").locator("form button[type=submit]").click();
  await expect(student).toHaveURL(second.path);
  return { student, username, first, second };
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`gives a student the items of the class, switches between two classes, and lands in the class that the student opened last, or joined last on a new device, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, username, first, second } = await studentOfTwoClasses(
      page,
      browser,
      locale,
    );
    const itemsOf = (classPath: string): [string, string][] =>
      [
        `${classPath}/portfolio`,
        `${classPath}/market`,
        `${classPath}/orders`,
        `${classPath}/measures`,
      ].map((path, index) => [text.studentItems[index] ?? "", path]);
    await student.goto(`${second.path}/orders`);
    await expectItems(student, locale, {
      items: itemsOf(second.path),
      current: text.studentItems[2] ?? "",
    });
    await expect(
      student.locator('button[popovertarget="class-switcher"]'),
    ).toContainText(otherClassName);

    const switcher = await openClassSwitcher(student);
    await expect(switcher.getByText(text.joinedClasses)).toBeVisible();
    const classLinks = switcher.getByRole("listitem").getByRole("link");
    await expect(classLinks).toHaveCount(2);
    for (const [index, testClass, isCurrent] of [
      [0, first, false],
      [1, second, true],
    ] as const) {
      const link = classLinks.nth(index);
      await expect(link).toHaveAttribute("href", `${testClass.path}/portfolio`);
      await expect(link).toContainText(widestClassNames.lecturerName);
      if (isCurrent) {
        await expect(link).toHaveAttribute("aria-current", "true");
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
    await expect(
      switcher.getByRole("link", { name: text.join, exact: true }),
    ).toHaveAttribute("href", "/join");
    await expectAccessibleScreen(student);
    await classLinks.nth(0).click();
    await expect(student).toHaveURL(`${first.path}/portfolio`);
    await expect(switcher).toBeHidden();
    await expectItems(student, locale, {
      items: itemsOf(first.path),
      current: text.studentItems[0] ?? "",
    });

    // The menu of the profile shows the widest name of a student.
    await openProfileMenu(student);
    await expectAccessibleScreen(student);
    await student.keyboard.press("Escape");
    // The browser keeps the class that the student opened last, so signing in again lands there and not in the class that the student joined last.
    await signOutAndIn(student, locale, username);
    await expect(student).toHaveURL(`${first.path}/portfolio`);
    const otherDevice = await newDevice(browser, locale);
    await otherDevice.goto("/sign-in");
    await submitSignIn(otherDevice, username, chosenPassword);
    await expect(otherDevice).toHaveURL(`${second.path}/portfolio`);
    await otherDevice.context().close();
    await student.context().close();
  });

  test(`lands a lecturer without a class on the form that creates one, and with a class in it, with the items of the class and its market, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, widestClassNames.lecturerName);
    await expect(page).toHaveURL(createClassPath);
    await expect(navigationItems(page, locale)).toHaveCount(0);
    const testClass = await createTestClass(page, widestClassNames.className);
    const student = await newDevice(browser, locale);
    await signInAsTestStudent(student, testClass, widestClassNames.studentName);
    await student.context().close();
    await page.goto("/");
    await expect(page).toHaveURL(testClass.path);
    const items: [string, string][] = [
      testClass.path,
      `${testClass.path}/portfolios`,
      `${testClass.path}/market`,
    ].map((path, index) => [text.lecturerItems[index] ?? "", path]);
    await expectItems(page, locale, {
      items: items,
      current: text.lecturerItems[0] ?? "",
    });
    const switcher = await openClassSwitcher(page);
    await expect(switcher.getByText(text.taughtClasses)).toBeVisible();
    await expect(switcher.getByRole("listitem")).toHaveText([
      new RegExp(`${widestClassNames.className}.*${text.oneStudent}`),
    ]);
    await expect(
      switcher.getByRole("link", { name: text.createClass, exact: true }),
    ).toHaveAttribute("href", createClassPath);
    await page.keyboard.press("Escape");
    await expect(switcher).toBeHidden();

    await navigationItems(page, locale)
      .filter({ hasText: text.lecturerItems[2] ?? "" })
      .click();
    await expect(page).toHaveURL(`${testClass.path}/market`);
    await expect(
      page.getByRole("heading", { level: 1, name: text.marketTitle }),
    ).toBeVisible();
    await expectItems(page, locale, {
      items: items,
      current: text.lecturerItems[2] ?? "",
    });
    await expectAccessibleScreen(page);
  });

  test(`lands a student whose class the person who runs the server removed on joining a class, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, widestClassNames.lecturerName);
    const testClass = await createTestClass(page, widestClassNames.className);
    const student = await newDevice(browser, locale);
    const username = await signInAsTestStudent(
      student,
      testClass,
      widestClassNames.studentName,
    );
    writeForTestStudent(testClass.id, (database, membershipId) => {
      database
        .delete(memberships)
        .where(eq(memberships.id, membershipId))
        .run();
    });
    await signOutAndIn(student, locale, username);
    await expect(student).toHaveURL("/join");
    await expect(navigationItems(student, locale)).toHaveCount(0);
    await expect(
      student.locator('button[popovertarget="class-switcher"]'),
    ).toHaveCount(0);
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`labels every screen as a simulation of delayed prices, and its card names the price that the latest update missed and the price that Portolab never stored, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/sign-in");
    await expect(
      page.getByRole("button", {
        name: isPhone() ? text.shortBadge : text.longBadge,
        exact: true,
      }),
    ).toBeVisible();
    const card = await openSimulationCard(page);
    await expect(card).toHaveAccessibleName(text.cardTitle);
    await expect(card.getByRole("paragraph")).toHaveCount(5);
    await expect(card.getByRole("paragraph").nth(0)).toHaveText(text.cardTitle);
    await expect(card.getByRole("paragraph").nth(1)).toHaveText(
      text.simulation,
    );
    await expect(card.getByRole("paragraph").nth(2)).toHaveText(
      text.latestPrice,
    );
    await expectTexts(card.getByRole("paragraph").nth(3), text.missedPrices);
    await expect(card.getByRole("paragraph").nth(4)).toHaveText(text.lesson);
    await expectAccessibleScreen(page);
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
  });

  test(`answers a reader who does not belong to a class at the address of its market as at an address that does not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFoundTitle,
      addresses: ({ otherClassPath }) => [
        { reader: "student", path: `${otherClassPath}/market` },
        { reader: "lecturer", path: `${otherClassPath}/market` },
        { reader: "otherLecturer", path: "/classes/999999999/market" },
      ],
    });
  });
}

test("opens the switcher of the class, the menu of the profile, and the card of the simulation with a keyboard alone, and closes each with Escape on the button that opened it", async ({
  page,
  browser,
}) => {
  const { student } = await studentOfTwoClasses(page, browser, "id");
  // The link that skips the navigation comes first on a page that the reader opens, and it moves the reader to the content.
  await student.reload();
  await student.keyboard.press("Tab");
  const skip = student.locator('a[href="#main"]');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await student.keyboard.press("Enter");
  await expect(student.getByRole("main")).toBeFocused();
  for (const popover of ["class-switcher", "top-profile", "simulation-card"]) {
    const button = student.locator(
      `button[popovertarget="${popover}"]:visible`,
    );
    await button.focus();
    await student.keyboard.press("Enter");
    const opened = student.locator(`#${popover}`);
    await expect(opened).toBeVisible();
    await student.keyboard.press("Escape");
    await expect(opened).toBeHidden();
    await expect(button).toBeFocused();
  }
  // A reader on a keyboard reaches the classes in the menu right after the switcher.
  const switcher = student.locator('button[popovertarget="class-switcher"]');
  await switcher.focus();
  await student.keyboard.press("Enter");
  await student.keyboard.press("Tab");
  await expect(
    student.locator("#class-switcher").getByRole("link").first(),
  ).toBeFocused();
  await student.keyboard.press("Enter");
  await expect(student).toHaveURL(/\/classes\/\d+\/portfolio$/);
  await student.context().close();
});

test("opens the switcher of the class and leads to the chosen class before JavaScript loads", async ({
  page,
  browser,
}) => {
  const { student, first } = await studentOfTwoClasses(page, browser, "id");
  const reader = await newDevice(browser, "id", {
    javaScriptEnabled: false,
    storageState: await student.context().storageState(),
  });
  await reader.goto(`${first.path}/portfolio`);
  const switcher = await openClassSwitcher(reader);
  await switcher.getByRole("listitem").getByRole("link").nth(1).click();
  await expect(reader).toHaveURL(/\/classes\/\d+\/portfolio$/);
  await expect(reader).not.toHaveURL(`${first.path}/portfolio`);
  await reader.context().close();
  await student.context().close();
});
