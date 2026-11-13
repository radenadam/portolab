import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { frameNavigation } from "./frame-navigation";
import type { FramedPage } from "./frame-navigation";

const labels: Record<
  Locale,
  {
    portfolio: string;
    orders: string;
    class: string;
    ranking: string;
    prices: string;
    classes: string;
    join: string;
    signIn: string;
    measures: string;
    backToPortfolio: string;
    backToMeasures: string;
    backToRanking: string;
    backToClass: string;
  }
> = {
  id: {
    portfolio: "Portofolio",
    orders: "Order",
    class: "Kelas",
    ranking: "Peringkat",
    prices: "Harga",
    classes: "Kelas Anda",
    join: "Gabung ke kelas",
    signIn: "Masuk",
    measures: "Imbal hasil dan risiko",
    backToPortfolio: "Kembali ke Portofolio",
    backToMeasures: "Kembali ke Imbal hasil dan risiko",
    backToRanking: "Kembali ke Peringkat",
    backToClass: "Kembali ke Kelas",
  },
  en: {
    portfolio: "Portfolio",
    orders: "Orders",
    class: "Class",
    ranking: "Ranking",
    prices: "Prices",
    classes: "Your classes",
    join: "Join a class",
    signIn: "Sign in",
    measures: "Return and risk",
    backToPortfolio: "Back to Portfolio",
    backToMeasures: "Back to Return and risk",
    backToRanking: "Back to Ranking",
    backToClass: "Back to Class",
  },
};

/** A page of a route at an address with the parameters and the query of a test. */
function pageForTest(
  routeId: string | undefined,
  params: FramedPage["params"] = {},
  search = "",
): FramedPage {
  return { routeId, params, search: new URLSearchParams(search) };
}

const inClass = { classId: "7" };

for (const locale of locales) {
  const label = labels[locale];
  const language = languageNames[locale];

  test(`gives a visitor the prices, joining a class, and sign-in, with the page itself as the current one, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      frameNavigation(
        undefined,
        pageForTest("features/market-data/prices-page"),
      ),
    ).toEqual({
      links: [
        { path: "/prices", label: label.prices, isCurrent: true },
        { path: "/join", label: label.join, isCurrent: false },
        { path: "/sign-in", label: label.signIn, isCurrent: false },
      ],
      backLink: undefined,
      showsDelayOnPhone: true,
    });
    expect(
      frameNavigation(
        undefined,
        pageForTest("features/classes/join-class-page"),
      ).links[1],
    ).toEqual({ path: "/join", label: label.join, isCurrent: true });
  });

  test(`gives a person who is signed in the classes and the prices outside a class, also on a page with a class in its address that no number names, in ${language}`, () => {
    switchLocaleForTest(locale);
    const outside = [
      { path: "/classes", label: label.classes, isCurrent: true },
      { path: "/prices", label: label.prices, isCurrent: false },
    ];
    expect(
      frameNavigation("student", pageForTest("features/classes/classes-page"))
        .links,
    ).toEqual(outside);
    expect(
      frameNavigation(
        "lecturer",
        pageForTest("features/classes/class-page", { classId: "abc" }),
      ).links,
    ).toEqual(outside.map((link) => ({ ...link, isCurrent: false })));
  });

  test(`gives a student in a class the portfolio, the prices, the orders, and the class, with the portfolio current on the pages below it, which link back to the page above them, in ${language}`, () => {
    switchLocaleForTest(locale);
    const links = [
      { path: "/classes/7/portfolio", label: label.portfolio, isCurrent: true },
      { path: "/prices", label: label.prices, isCurrent: false },
      { path: "/classes/7/orders", label: label.orders, isCurrent: false },
      { path: "/classes/7", label: label.class, isCurrent: false },
    ];
    expect(
      frameNavigation(
        "student",
        pageForTest("features/trading/portfolio-page", inClass),
      ),
    ).toEqual({ links, backLink: undefined, showsDelayOnPhone: true });
    expect(
      frameNavigation(
        "student",
        pageForTest("features/measures/measures-page", inClass),
      ),
    ).toEqual({
      links,
      backLink: {
        path: "/classes/7/portfolio",
        label: label.portfolio,
        name: label.backToPortfolio,
      },
      showsDelayOnPhone: true,
    });
    expect(
      frameNavigation(
        "student",
        pageForTest("features/measures/stock-measures-page", {
          ...inClass,
          code: "BBCA",
        }),
      ),
    ).toEqual({
      links,
      backLink: {
        path: "/classes/7/measures",
        label: label.measures,
        name: label.backToMeasures,
      },
      showsDelayOnPhone: true,
    });
  });

  test(`links the orders with a chosen stock back to the portfolio and leaves the delay to the order ticket on a phone, and the orders without one to neither, in ${language}`, () => {
    switchLocaleForTest(locale);
    const withStock = frameNavigation(
      "student",
      pageForTest("features/trading/orders-page", inClass, "?code=BBCA"),
    );
    expect(withStock.links[2]).toEqual({
      path: "/classes/7/orders",
      label: label.orders,
      isCurrent: true,
    });
    expect(withStock.backLink).toEqual({
      path: "/classes/7/portfolio",
      label: label.portfolio,
      name: label.backToPortfolio,
    });
    expect(withStock.showsDelayOnPhone).toBe(false);
    const withoutStock = frameNavigation(
      "student",
      pageForTest("features/trading/orders-page", inClass),
    );
    expect(withoutStock.backLink).toBeUndefined();
    expect(withoutStock.showsDelayOnPhone).toBe(true);
  });

  test(`gives a lecturer in a class the classes, the class, the ranking, and the prices, with the ranking current on the pages of a student and the class current on the pages below it, which link back to the page above them, in ${language}`, () => {
    switchLocaleForTest(locale);
    const links = (current: string): object[] =>
      [
        { path: "/classes", label: label.classes },
        { path: "/classes/7", label: label.class },
        { path: "/classes/7/portfolios", label: label.ranking },
        { path: "/prices", label: label.prices },
      ].map((link) => ({ ...link, isCurrent: link.label === current }));
    const ofStudent = { ...inClass, studentId: "9" };
    expect(
      frameNavigation(
        "lecturer",
        pageForTest("features/grading/class-portfolios-page", inClass),
      ),
    ).toEqual({
      links: links(label.ranking),
      backLink: undefined,
      showsDelayOnPhone: true,
    });
    expect(
      frameNavigation(
        "lecturer",
        pageForTest("features/grading/student-portfolio-page", ofStudent),
      ).backLink,
    ).toEqual({
      path: "/classes/7/portfolios",
      label: label.ranking,
      name: label.backToRanking,
    });
    expect(
      frameNavigation(
        "lecturer",
        pageForTest("features/grading/student-measures-page", ofStudent),
      ),
    ).toEqual({
      links: links(label.ranking),
      backLink: {
        path: "/classes/7/students/9/portfolio",
        label: label.portfolio,
        name: label.backToPortfolio,
      },
      showsDelayOnPhone: true,
    });
    for (const pageBelowClass of [
      pageForTest("features/classes/reset-password-page", ofStudent),
      pageForTest("features/classes/calendar-page", inClass),
    ]) {
      expect(frameNavigation("lecturer", pageBelowClass)).toEqual({
        links: links(label.class),
        backLink: {
          path: "/classes/7",
          label: label.class,
          name: label.backToClass,
        },
        showsDelayOnPhone: true,
      });
    }
  });
}

test("marks no page current on a page that the navigation does not hold, nor on a route that it does not know", () => {
  for (const routeId of [
    "features/home/home-page",
    "not-found-page",
    "features/accounts/account-page",
    undefined,
  ]) {
    expect(
      frameNavigation("student", pageForTest(routeId, inClass)).links.some(
        (link) => link.isCurrent,
      ),
      String(routeId),
    ).toBe(false);
  }
});

test("links a page of a student back to nothing when its address names the student by no number", () => {
  expect(
    frameNavigation(
      "lecturer",
      pageForTest("features/grading/student-measures-page", {
        ...inClass,
        studentId: "abc",
      }),
    ).backLink,
  ).toBeUndefined();
});
