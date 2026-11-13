import type { Register } from "react-router";
import type { Role, UserId } from "~/features/accounts/accounts.schema";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  classPortfoliosPath,
  studentPortfolioPath,
} from "~/features/grading/grading-paths";
import { measuresPath } from "~/features/measures/measures-path";
import { ordersPath } from "~/features/trading/orders-path";
import { portfolioPath } from "~/features/trading/portfolio-path";
import type { BackLink, FrameLink } from "~/frame";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";

/** The pages of a class that the navigation of a student or a lecturer holds. */
type ClassPage = "portfolio" | "orders" | "class" | "ranking";

/** The pages outside a class that a navigation holds. */
type OtherPage = "prices" | "classes" | "join" | "signIn";

type NavigationPage = ClassPage | OtherPage;

/** A page that other pages are below, to which a phone links back. */
type PageAbove =
  "portfolio" | "measures" | "ranking" | "studentPortfolio" | "class";

interface PagePlace {
  /** The page of the navigation that is current on this page: the page itself, or the nearest page above it that a navigation holds. */
  current: NavigationPage | undefined;
  above: PageAbove | undefined;
  /** Whether the page shows the order ticket of the stock that its address chose, which a desktop shows beside the portfolio, so a phone links back to the portfolio, and whose first part gives the delay of prices. */
  hasTicket: boolean;
}

/** The route of a page, by the id that React Router gives the module of the route. */
type RouteId = Exclude<keyof Register["routeModules"], "root">;

const nowhere: PagePlace = {
  current: undefined,
  above: undefined,
  hasTicket: false,
};

function place(current: NavigationPage, above?: PageAbove): PagePlace {
  return { current, above, hasTicket: false };
}

// Decision 0026 sets which pages are below another page and which page of the navigation is current on each.
const pagePlaces: Record<RouteId, PagePlace> = {
  "features/home/home-page": nowhere,
  "features/market-data/prices-page": place("prices"),
  "features/accounts/sign-in-page": place("signIn"),
  "features/accounts/sign-out-page": nowhere,
  "features/accounts/account-page": nowhere,
  "features/accounts/account-setup-page": nowhere,
  "features/accounts/privacy-page": nowhere,
  "features/classes/classes-page": place("classes"),
  "features/classes/class-page": place("class"),
  "features/classes/calendar-page": place("class", "class"),
  "features/trading/orders-page": { ...place("orders"), hasTicket: true },
  "features/trading/portfolio-page": place("portfolio"),
  "features/measures/measures-page": place("portfolio", "portfolio"),
  "features/measures/stock-measures-page": place("portfolio", "measures"),
  "features/grading/class-portfolios-page": place("ranking"),
  // The workbook is a download, which opens no page.
  "features/grading/workbook-route": nowhere,
  "features/grading/student-portfolio-page": place("ranking", "ranking"),
  "features/grading/student-measures-page": place(
    "ranking",
    "studentPortfolio",
  ),
  "features/classes/reset-password-page": place("class", "class"),
  "features/classes/join-page": place("join"),
  "features/classes/join-class-page": place("join"),
  "features/language/language-page": nowhere,
  "features/health/health-route": nowhere,
  "not-found-page": nowhere,
};

const pageLabels: Record<NavigationPage | PageAbove, () => string> = {
  portfolio: m.navigation_portfolio_link,
  orders: m.navigation_orders_link,
  class: m.navigation_class_link,
  ranking: m.navigation_ranking_link,
  prices: m.navigation_prices_link,
  classes: m.navigation_classes_link,
  join: m.navigation_join_link,
  signIn: m.navigation_sign_in_link,
  measures: m.navigation_measures_link,
  studentPortfolio: m.navigation_portfolio_link,
};

const classPagePaths: Record<ClassPage, (classId: ClassId) => string> = {
  portfolio: portfolioPath,
  orders: ordersPath,
  class: classPath,
  ranking: classPortfoliosPath,
};

const otherPagePaths: Record<OtherPage, string> = {
  prices: "/prices",
  classes: "/classes",
  join: "/join",
  signIn: "/sign-in",
};

/** The page that the frame shows: the id of its route, the parameters of its address, and the query of its address. */
export interface FramedPage {
  routeId: string | undefined;
  params: Readonly<Record<string, string | undefined>>;
  search: URLSearchParams;
}

/** What the frame shows of the navigation of a reader on a page. */
export interface FrameNavigation {
  links: FrameLink[];
  backLink: BackLink | undefined;
  /** Whether a phone shows the delay of prices under the top bar, which a page leaves out when its first part gives the delay. */
  showsDelayOnPhone: boolean;
}

/** The navigation of a reader on a page, as decision 0026 sets it: the pages of the reader with the current one, and the link back to the page above it, which a phone shows in place of the mark. The role is undefined for a visitor who is not signed in. */
export function frameNavigation(
  role: Role | undefined,
  page: FramedPage,
): FrameNavigation {
  const pagePlace = placeOf(page.routeId);
  const classId = parseRecordId<ClassId>(page.params["classId"], "classId");
  const pages = readerPages(role, classId.ok ? classId.value : undefined);
  const hasChosenStock = pagePlace.hasTicket && page.search.has("code");
  const above = hasChosenStock ? "portfolio" : pagePlace.above;
  return {
    links: pages.map((navigationPage) => ({
      path: navigationPage.path,
      label: pageLabels[navigationPage.page](),
      isCurrent: navigationPage.page === pagePlace.current,
    })),
    backLink:
      above === undefined || !classId.ok
        ? undefined
        : backLinkTo(above, classId.value, page.params),
    showsDelayOnPhone: !hasChosenStock,
  };
}

function placeOf(routeId: string | undefined): PagePlace {
  const places = new Map<string, PagePlace>(Object.entries(pagePlaces));
  return (routeId === undefined ? undefined : places.get(routeId)) ?? nowhere;
}

/** The pages of the navigation of a reader, inside the class of the address or outside a class. */
function readerPages(
  role: Role | undefined,
  classId: ClassId | undefined,
): { page: NavigationPage; path: string }[] {
  const other = (page: OtherPage): { page: NavigationPage; path: string } => ({
    page,
    path: otherPagePaths[page],
  });
  if (role === undefined) {
    return [other("prices"), other("join"), other("signIn")];
  }
  if (classId === undefined) {
    return [other("classes"), other("prices")];
  }
  const inClass = (
    page: ClassPage,
  ): { page: NavigationPage; path: string } => ({
    page,
    path: classPagePaths[page](classId),
  });
  switch (role) {
    case "student":
      return [
        inClass("portfolio"),
        other("prices"),
        inClass("orders"),
        inClass("class"),
      ];
    case "lecturer":
      return [
        other("classes"),
        inClass("class"),
        inClass("ranking"),
        other("prices"),
      ];
  }
}

function backLinkTo(
  above: PageAbove,
  classId: ClassId,
  params: FramedPage["params"],
): BackLink | undefined {
  const path = abovePath(above, classId, params);
  if (path === undefined) {
    return undefined;
  }
  const label = pageLabels[above]();
  return { path, label, name: m.navigation_back_link({ page: label }) };
}

function abovePath(
  above: PageAbove,
  classId: ClassId,
  params: FramedPage["params"],
): string | undefined {
  switch (above) {
    case "portfolio":
    case "class":
    case "ranking":
      return classPagePaths[above](classId);
    case "measures":
      return measuresPath(classId);
    case "studentPortfolio": {
      const studentId = parseRecordId<UserId>(params["studentId"], "studentId");
      return studentId.ok
        ? studentPortfolioPath(classId, studentId.value)
        : undefined;
    }
  }
}
