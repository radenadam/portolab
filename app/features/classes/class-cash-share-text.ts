import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { TeachingStudent } from "./class-teaching";

export function classCashShareText(
  students: readonly TeachingStudent[],
): string | undefined {
  if (students.length === 0) return undefined;
  let shares = 0;
  for (const student of students) {
    if (student.value === undefined || student.value === 0) return undefined;
    shares += student.cash / student.value;
  }
  return m.classes_cash_share_part({
    cash: formatPercent(portfolioWeight(shares / students.length), "integer"),
  });
}
