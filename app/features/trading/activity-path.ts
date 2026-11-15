import type { PortfolioKind } from "./portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { portfolioHome } from "./portfolio-home";

export function activityPath(
  classId: ClassId,
  kind: PortfolioKind = "membership",
): string {
  return `${portfolioHome(classId, kind).path}/activity`;
}
