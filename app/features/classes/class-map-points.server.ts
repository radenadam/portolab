import type { UserId } from "~/features/accounts/accounts.schema";
import { studentPortfolioPath } from "~/features/grading/grading-paths";
import type { ClassId } from "./classes.schema";
import type { MarkedPoint } from "~/charts/layout-risk-map";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ClassRisk, ClassMapAxis } from "./class-map";
import type { ClassOverview } from "./read-class-overview.server";

/** Notable portfolios need names on a crowded map, while the table and tooltip can name every student. */
export function classMapPoints(
  overview: ClassOverview,
  { axis, classId }: { axis: ClassMapAxis; classId: ClassId },
): MarkedPoint<ClassRisk, CumulativeReturn>[] {
  const measured = overview.students.filter(
    (student) => student.risk !== undefined && student.return !== undefined,
  );
  const named = extremeIds(measured);
  const points: MarkedPoint<ClassRisk, CumulativeReturn>[] = [];
  for (const student of measured) {
    const risk = student.risk;
    if (risk === undefined || student.return === undefined) continue;
    const isActive = student.ordersThisWeek > 0;
    const values: Record<ClassMapAxis, ClassRisk> = {
      beta: risk.beta,
      deviation: risk.standardDeviation,
    };
    const across = values[axis];
    points.push({
      key: String(student.id),
      name: student.name,
      href: studentPortfolioPath(classId, student.id),
      label: named.has(student.id) ? student.name : "",
      across,
      up: student.return,
      mark: { kind: isActive ? "active" : "other" },
      values: [
        {
          name: m.classes_map_return_label(),
          value: formatSignedPercent(student.return),
        },
        { name: m.classes_map_beta_label(), value: formatBeta(risk.beta) },
        {
          name: m.classes_map_deviation_label(),
          value: formatPercent(risk.standardDeviation),
        },
        { name: m.classes_map_last_order_label(), value: student.lastOrder },
      ],
    });
  }
  return points;
}

function extremeIds(measured: ClassOverview["students"]): Set<UserId> {
  const named = new Set<UserId>();
  for (const valueOf of [
    (student: (typeof measured)[number]) => student.return,
    (student: (typeof measured)[number]) =>
      student.return === undefined ? undefined : 0 - student.return,
    (student: (typeof measured)[number]) => student.risk?.standardDeviation,
    (student: (typeof measured)[number]) => student.risk?.alpha,
  ]) {
    let highest: { id: UserId; value: number } | undefined;
    for (const student of measured) {
      const value = valueOf(student);
      if (
        value !== undefined &&
        (highest === undefined || value > highest.value)
      )
        highest = { id: student.id, value };
    }
    if (highest !== undefined) named.add(highest.id);
  }
  return named;
}
