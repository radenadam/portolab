import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { frameItems, workspaceHomePath } from "./frame-navigation";
import type { FramedPage } from "./frame-navigation";
import type { FrameReader, WorkspaceClass } from "./frame-reader";

const labels: Record<
  Locale,
  {
    home: string;
    market: string;
    activity: string;
    analysis: string;
    class: string;
    students: string;
    prices: string;
    join: string;
    signIn: string;
  }
> = {
  id: {
    home: "Beranda",
    market: "Pasar",
    activity: "Aktivitas",
    analysis: "Analisis",
    class: "Kelas",
    students: "Mahasiswa",
    prices: "Harga",
    join: "Gabung ke kelas",
    signIn: "Masuk",
  },
  en: {
    home: "Home",
    market: "Market",
    activity: "Activity",
    analysis: "Analysis",
    class: "Class",
    students: "Students",
    prices: "Prices",
    join: "Join a class",
    signIn: "Sign in",
  },
};

/** A page of a route at an address with the parameters of a test. */
function pageForTest(
  routeId: string | undefined,
  params: FramedPage["params"] = {},
): FramedPage {
  return { routeId, params };
}

const classOfWorkspace: WorkspaceClass = {
  id: 7 as ClassId,
  name: "Manajemen Portofolio A",
  term: undefined,
  people: { kind: "students", count: 2 },
};

function readerForTest(role: "student" | "lecturer"): FrameReader {
  return {
    kind: "user",
    role,
    name: "Sari Wulandari",
    workspace: { current: classOfWorkspace, classes: [classOfWorkspace] },
  };
}

const inClass = { classId: "7" };

for (const locale of locales) {
  const label = labels[locale];
  const language = languageNames[locale];

  test(`gives a visitor the prices, joining a class, and sign-in, with the page itself as the current one, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      frameItems(
        { kind: "visitor" },
        pageForTest("features/market-data/prices-page"),
      ),
    ).toEqual([
      { path: "/prices", label: label.prices, icon: "trend", isCurrent: true },
      { path: "/join", label: label.join, icon: "join", isCurrent: false },
      {
        path: "/sign-in",
        label: label.signIn,
        icon: "signIn",
        isCurrent: false,
      },
    ]);
    expect(
      frameItems(
        { kind: "visitor" },
        pageForTest("features/classes/join-class-page"),
      )[1]?.isCurrent,
    ).toBe(true);
  });

  test(`gives a student in a class Beranda, Pasar, Aktivitas, and Analisis, each leading to the page that holds it, with the current one on its pages and on the pages below them, in ${language}`, () => {
    switchLocaleForTest(locale);
    const items = (current: string): object[] =>
      [
        { path: "/classes/7", label: label.home, icon: "map" },
        { path: "/classes/7/market", label: label.market, icon: "trend" },
        { path: "/classes/7/orders", label: label.activity, icon: "list" },
        { path: "/classes/7/measures", label: label.analysis, icon: "pie" },
      ].map((item) => ({ ...item, isCurrent: item.label === current }));
    for (const [routeId, current] of [
      ["features/classes/class-page", label.home],
      ["features/market-data/market-page", label.market],
      ["features/trading/orders-page", label.activity],
      ["features/measures/measures-page", label.analysis],
      ["features/measures/stock-measures-page", label.analysis],
    ] as const) {
      expect(
        frameItems(readerForTest("student"), pageForTest(routeId, inClass)),
        routeId,
      ).toEqual(items(current));
    }
  });

  test(`gives a lecturer in a class Kelas, Mahasiswa, and Pasar, with Mahasiswa current on the pages of a student and Kelas on the pages below the class, in ${language}`, () => {
    switchLocaleForTest(locale);
    const items = (current: string): object[] =>
      [
        { path: "/classes/7", label: label.class, icon: "cap" },
        {
          path: "/classes/7/portfolios",
          label: label.students,
          icon: "users",
        },
        { path: "/classes/7/market", label: label.market, icon: "trend" },
      ].map((item) => ({ ...item, isCurrent: item.label === current }));
    const ofStudent = { ...inClass, studentId: "9" };
    for (const [page, current] of [
      [pageForTest("features/classes/class-page", inClass), label.class],
      [pageForTest("features/classes/calendar-page", inClass), label.class],
      [
        pageForTest("features/classes/reset-password-page", ofStudent),
        label.class,
      ],
      [
        pageForTest("features/grading/class-portfolios-page", inClass),
        label.students,
      ],
      [
        pageForTest("features/grading/student-portfolio-page", ofStudent),
        label.students,
      ],
      [
        pageForTest("features/grading/student-measures-page", ofStudent),
        label.students,
      ],
      [pageForTest("features/market-data/market-page", inClass), label.market],
    ] as const) {
      expect(frameItems(readerForTest("lecturer"), page), page.routeId).toEqual(
        items(current),
      );
    }
  });
}

test("marks no item current on a page outside the items, on a route that it does not know, on a page of another class than the workspace, and on a page of a class that its address names by no number", () => {
  for (const page of [
    pageForTest("features/accounts/account-page"),
    pageForTest("features/classes/classes-page"),
    pageForTest("not-found-page"),
    pageForTest(undefined, inClass),
    pageForTest("features/classes/class-page", { classId: "8" }),
    pageForTest("features/classes/class-page", { classId: "abc" }),
  ]) {
    expect(
      frameItems(readerForTest("student"), page).some((item) => item.isCurrent),
      JSON.stringify(page),
    ).toBe(false);
  }
});

test("gives no items to a person without a class, to a person who has not finished the account, and to a page without the data of the frame", () => {
  const page = pageForTest("features/classes/classes-page");
  expect(
    frameItems(
      { kind: "user", role: "lecturer", name: "Budi", workspace: undefined },
      page,
    ),
  ).toEqual([]);
  expect(frameItems({ kind: "settingUp" }, page)).toEqual([]);
  expect(frameItems(undefined, page)).toEqual([]);
});

test("leads each role to the home of a class, which is the first item of its navigation", () => {
  const classId = 7 as ClassId;
  expect(workspaceHomePath("student", classId)).toBe("/classes/7");
  expect(workspaceHomePath("lecturer", classId)).toBe("/classes/7");
  for (const role of ["student", "lecturer"] as const) {
    expect(
      frameItems(readerForTest(role), pageForTest(undefined))[0]?.path,
    ).toBe(workspaceHomePath(role, classId));
  }
});
