import { portfolioHome } from "~/features/trading/portfolio-home";
import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";

export function measuresPath(
  classId: ClassId,
  kind: PortfolioKind = "membership",
): string {
  return `${portfolioHome(classId, kind).path}/analysis`;
}
