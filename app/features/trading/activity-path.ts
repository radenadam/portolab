import type { PortfolioKind } from "./portfolio-store.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { demonstrationPath } from "./demonstration-path";

export function activityPath(
  classId: ClassId,
  kind: PortfolioKind = "membership",
): string {
  const paths: Record<PortfolioKind, string> = {
    membership: classPath(classId),
    demonstration: demonstrationPath(classId),
  };
  return `${paths[kind]}/activity`;
}
