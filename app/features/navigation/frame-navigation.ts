import type { Register } from "react-router";
import type { Role } from "~/features/accounts/accounts.schema";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { classPortfoliosPath } from "~/features/grading/grading-paths";
import { marketPath } from "~/features/market-data/market-path";
import { measuresPath } from "~/features/measures/measures-path";
import { ordersPath } from "~/features/trading/orders-path";
import type { FrameItem } from "~/frame";
import type { IconName } from "~/icon";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";
import type { FrameReader } from "./frame-reader";

/** An item of the navigation of a class. */
type WorkspaceItem =
  "home" | "market" | "activity" | "analysis" | "class" | "students";

/** An item of the navigation of a visitor who is not signed in. */
type VisitorItem = "prices" | "join" | "signIn";

type NavigationItem = WorkspaceItem | VisitorItem;

// Decision 0030 sets the items of each role and their order.
const roleItems: Record<Role, readonly [WorkspaceItem, ...WorkspaceItem[]]> = {
  student: ["home", "market", "activity", "analysis"],
  lecturer: ["class", "students", "market"],
};

const visitorItems: readonly VisitorItem[] = ["prices", "join", "signIn"];

// Each item leads to the page that holds it today. Decision 0030 gives the address that each page takes when the change of issue #127 rebuilds its screen.
const workspacePaths: Record<WorkspaceItem, (classId: ClassId) => string> = {
  home: classPath,
  market: marketPath,
  activity: ordersPath,
  analysis: measuresPath,
  class: classPath,
  students: classPortfoliosPath,
};

const visitorPaths: Record<VisitorItem, string> = {
  prices: "/prices",
  join: "/join",
  signIn: "/sign-in",
};

const itemLabels: Record<NavigationItem, () => string> = {
  home: m.navigation_home_link,
  market: m.navigation_market_link,
  activity: m.navigation_activity_link,
  analysis: m.navigation_analysis_link,
  class: m.navigation_class_link,
  students: m.navigation_students_link,
  prices: m.navigation_prices_link,
  join: m.navigation_join_link,
  signIn: m.navigation_sign_in_link,
};

const itemIcons: Record<NavigationItem, IconName> = {
  home: "map",
  market: "trend",
  activity: "list",
  analysis: "pie",
  class: "cap",
  students: "users",
  prices: "trend",
  join: "join",
  signIn: "signIn",
};

/** The route of a page, by the id that React Router gives the module of the route. */
type RouteId = Exclude<keyof Register["routeModules"], "root">;

// The item that is current on each page: the item of the page itself, or of the nearest page above it, such as the analysis above the measures of one stock. A page outside the items has none.
const currentItems: Record<RouteId, NavigationItem | undefined> = {
  "features/home/home-page": undefined,
  "features/market-data/prices-page": "prices",
  "features/market-data/market-page": "market",
  "features/accounts/sign-in-page": "signIn",
  "features/accounts/sign-out-page": undefined,
  "features/accounts/account-page": undefined,
  "features/accounts/account-setup-page": undefined,
  "features/accounts/privacy-page": undefined,
  "features/classes/classes-page": undefined,
  "features/classes/class-page": "class",
  "features/classes/calendar-page": "class",
  "features/trading/orders-page": "activity",
  "features/measures/measures-page": "analysis",
  "features/measures/stock-measures-page": "analysis",
  "features/grading/class-portfolios-page": "students",
  // The workbook is a download, which opens no page.
  "features/grading/workbook-route": undefined,
  "features/grading/student-portfolio-page": "students",
  "features/grading/student-measures-page": "students",
  "features/classes/reset-password-page": "class",
  "features/classes/join-page": "join",
  "features/classes/join-class-page": "join",
  "features/language/language-page": undefined,
  "features/health/health-route": undefined,
  "not-found-page": undefined,
};

/** The page that the frame shows: the id of its route and the parameters of its address. */
export interface FramedPage {
  routeId: string | undefined;
  params: Readonly<Record<string, string | undefined>>;
}

/** The items of the navigation of a reader on a page, as decision 0030 sets them: the items of the role in the class of the workspace, or the items of a visitor, each with whether it is current. A person without a class, a person who has not finished the account, and a page without the data of the frame have none. */
export function frameItems(
  reader: FrameReader | undefined,
  page: FramedPage,
): FrameItem[] {
  const current =
    page.routeId === "features/classes/class-page" &&
    reader?.kind === "user" &&
    reader.role === "student"
      ? "home"
      : currentItemOf(page.routeId);
  if (reader === undefined) {
    return [];
  }
  switch (reader.kind) {
    case "visitor":
      return visitorItems.map((item) => ({
        ...itemOf(item, current),
        path: visitorPaths[item],
      }));
    case "settingUp":
      return [];
    case "user": {
      const { workspace } = reader;
      if (workspace === undefined) {
        return [];
      }
      const classId = workspace.current.id;
      // A page of a class that the reader may not see answers as one that does not exist in the workspace of another class, so none of its items is current there.
      const addressClassId = parseRecordId<ClassId>(
        page.params["classId"],
        "classId",
      );
      const isInWorkspace =
        addressClassId.ok && addressClassId.value === classId;
      return roleItems[reader.role].map((item) => ({
        ...itemOf(item, isInWorkspace ? current : undefined),
        path: workspacePaths[item](classId),
      }));
    }
  }
}

/** The address of the home of a class for a role, which is the first item of its navigation and where a person lands in the class. */
export function workspaceHomePath(role: Role, classId: ClassId): string {
  return workspacePaths[roleItems[role][0]](classId);
}

function itemOf(
  item: NavigationItem,
  current: NavigationItem | undefined,
): Omit<FrameItem, "path"> {
  return {
    label: itemLabels[item](),
    icon: itemIcons[item],
    isCurrent: item === current,
  };
}

function currentItemOf(
  routeId: string | undefined,
): NavigationItem | undefined {
  const items = new Map<string, NavigationItem | undefined>(
    Object.entries(currentItems),
  );
  return routeId === undefined ? undefined : items.get(routeId);
}
