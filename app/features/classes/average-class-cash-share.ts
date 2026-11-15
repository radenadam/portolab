import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { TeachingStudent } from "./class-teaching";

export function averageClassCashShare(
  students: readonly TeachingStudent[],
): PortfolioWeight | undefined {
  if (students.length === 0) return undefined;
  let shares = 0;
  for (const student of students) {
    if (student.value === undefined || student.value === 0) return undefined;
    shares += student.cash / student.value;
  }
  return portfolioWeight(shares / students.length);
}
