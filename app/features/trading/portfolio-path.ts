import type { ClassId } from "~/features/classes/classes.schema";
import { classPath } from "~/features/classes/class-path";
import { demonstrationPath } from "./demonstration-path";
import type { PortfolioKind } from "./portfolio-store.server";

export function portfolioPath(classId: ClassId, kind: PortfolioKind): string {
  switch (kind) {
    case "membership":
      return classPath(classId);
    case "demonstration":
      return demonstrationPath(classId);
  }
}
