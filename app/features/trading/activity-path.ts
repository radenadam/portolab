import type { PortfolioKind } from "./portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { portfolioPath } from "./portfolio-path";

export function activityPath(
  classId: ClassId,
  kind: PortfolioKind = "membership",
): string {
  return `${portfolioPath(classId, kind)}/activity`;
}
