import { measureRiskFreeRate } from "~/features/measures/measure-risk-free-rate";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatNumber, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { wibDateOf } from "~/wib";
import { classCashShareText } from "./class-cash-share-text";
import { classActivity } from "./class-activity";
import type { TeachingStudent } from "./class-teaching";

export function classIntroQuestions(
  session: 1 | 2 | 3 | 4 | 5 | 6,
  students: readonly TeachingStudent[],
  now: Date,
): string[] {
  const cashShare = classCashShareText(students);
  const members = studentCount(students.length);
  const invested = studentCount(
    students.filter((student) => student.holdingCount > 0).length,
  );
  switch (session) {
    case 1:
      return [
        m.classes_goals_members_notice({ students: members }),
        cashShare === undefined
          ? m.classes_goals_cash_pending_notice()
          : m.classes_goals_cash_notice({ cashShare }),
      ];
    case 2:
      return [
        m.classes_theory_risk_notice({
          students: studentCount(
            students.filter((student) => student.risk !== undefined).length,
          ),
        }),
        m.classes_theory_holdings_notice({
          students: studentCount(
            students.filter((student) => student.holdingCount === 1).length,
          ),
        }),
      ];
    case 3: {
      return [
        cashShare === undefined
          ? m.classes_time_cash_pending_notice()
          : m.classes_time_cash_notice({ cashShare }),
        timeRateQuestion(now),
      ];
    }
    case 4:
      return [
        m.classes_market_holders_notice({ students: invested }),
        m.classes_market_members_notice({
          students: members,
          index: marketIndex.code,
        }),
      ];
    case 5:
      return [
        m.classes_instruments_holders_notice({ students: invested }),
        cashShare === undefined
          ? m.classes_instruments_cash_pending_notice()
          : m.classes_instruments_cash_notice({ cashShare }),
      ];
    case 6: {
      const { ordersThisWeek } = classActivity(students);
      return [
        m.classes_mechanism_unfilled_notice({
          students: studentCount(
            students.filter((student) => student.orderHistory === "unfilled")
              .length,
          ),
        }),
        ordersThisWeek === 1
          ? m.classes_one_mechanism_order_notice({
              count: formatNumber(ordersThisWeek),
            })
          : m.classes_several_mechanism_orders_notice({
              count: formatNumber(ordersThisWeek),
            }),
      ];
    }
  }
}

function studentCount(count: number): string {
  const inputs = { count: formatNumber(count) };
  return count === 1
    ? m.classes_one_discussion_student_part(inputs)
    : m.classes_several_discussion_students_part(inputs);
}

function timeRateQuestion(now: Date): string {
  const rate = measureRiskFreeRate(wibDateOf(now));
  return rate.ok
    ? m.classes_time_rate_notice({
        rate: formatPercent(rate.value.inputs.annualRate),
      })
    : m.classes_time_rate_pending_notice();
}
