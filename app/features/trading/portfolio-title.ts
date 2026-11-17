import type { PortfolioKind } from "./portfolio-store.server";
import { m } from "~/paraglide/messages.js";
import { homeTitle } from "./home-title";

export function portfolioTitle(kind: PortfolioKind): string {
  switch (kind) {
    case "membership":
      return homeTitle();
    case "demonstration":
      return m.trading_demonstration_title();
  }
}
