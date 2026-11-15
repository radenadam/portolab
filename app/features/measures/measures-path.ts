import { portfolioPath } from "~/features/trading/portfolio-path";
import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";

export function measuresPath(
  classId: ClassId,
  kind: PortfolioKind = "membership",
): string {
  return `${portfolioPath(classId, kind)}/analysis`;
}
