import type { PortfolioKind } from "./portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { homeTitle } from "./home-title";
import { portfolioPath } from "./portfolio-path";

export function portfolioHome(
  classId: ClassId,
  kind: PortfolioKind,
): { path: string; title: string } {
  return { path: portfolioPath(classId, kind), title: portfolioTitle(kind) };
}

export function portfolioTitle(kind: PortfolioKind): string {
  switch (kind) {
    case "membership":
      return homeTitle();
    case "demonstration":
      return m.trading_demonstration_title();
  }
}
