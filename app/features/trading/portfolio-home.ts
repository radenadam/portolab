import type { PortfolioKind } from "./portfolio-store.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { demonstrationPath } from "./demonstration-path";
import { homeTitle } from "./home-title";

export function portfolioHome(
  classId: ClassId,
  kind: PortfolioKind,
): { path: string; title: string } {
  switch (kind) {
    case "membership":
      return { path: classPath(classId), title: portfolioTitle(kind) };
    case "demonstration":
      return {
        path: demonstrationPath(classId),
        title: portfolioTitle(kind),
      };
  }
}

export function portfolioTitle(kind: PortfolioKind): string {
  switch (kind) {
    case "membership":
      return homeTitle();
    case "demonstration":
      return m.trading_demonstration_title();
  }
}
