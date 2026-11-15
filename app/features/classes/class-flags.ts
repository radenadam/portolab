import { studentsAddress } from "~/features/grading/students-address";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ClassId } from "./classes.schema";
import type { ClassFlag, TeachingStudent } from "./class-teaching";
import { extremeOf } from "./extreme-of";

export function classFlags(
  students: readonly TeachingStudent[],
  classId: ClassId,
): ClassFlag[] {
  const flags: ClassFlag[] = [];
  const loss = extremeOf(students, (student) => student.return, false);
  const wild = extremeOf(
    students,
    (student) =>
      student.return === undefined
        ? undefined
        : student.risk?.standardDeviation,
    true,
  );
  const losing =
    loss?.return !== undefined &&
    formatSignedPercent(loss.return).direction === "fall"
      ? { ...loss, return: loss.return }
      : undefined;
  if (losing !== undefined) flags.push(lossFlag(losing, wild, classId));
  if (
    wild?.risk !== undefined &&
    wild.return !== undefined &&
    wild.id !== losing?.id
  )
    flags.push(
      volatileFlag({ ...wild, risk: wild.risk, return: wild.return }, classId),
    );
  const none = holdingsFlag(students, classId);
  if (none !== undefined) flags.push(none);
  const idle = inactiveFlag(students, classId);
  if (idle !== undefined) flags.push(idle);
  return flags;
}

function flagAddress(
  classId: ClassId,
  studentId: TeachingStudent["id"] | undefined,
  filter: "all" | "inactive" | "no-stocks" = "all",
): string {
  return studentsAddress(classId, {
    measure: "alpha",
    query: "",
    filter,
    studentId,
  });
}

function lossFlag(
  loss: TeachingStudent & { return: CumulativeReturn },
  wild: TeachingStudent | undefined,
  classId: ClassId,
): ClassFlag {
  const inputs = { change: formatSignedPercent(loss.return).text };
  const text =
    wild?.id === loss.id && loss.risk !== undefined
      ? m.classes_flag_combined_notice({
          ...inputs,
          deviation: formatPercent(loss.risk.standardDeviation),
        })
      : loss.risk === undefined
        ? m.classes_flag_loss_notice(inputs)
        : m.classes_flag_loss_beta_notice({
            ...inputs,
            beta: formatBeta(loss.risk.beta),
          });
  return {
    key: "loss",
    tone: "loss",
    group: false,
    name: loss.name,
    text: text + inactivity(loss),
    href: flagAddress(classId, loss.id),
  };
}

function volatileFlag(
  wild: TeachingStudent & {
    risk: NonNullable<TeachingStudent["risk"]>;
    return: CumulativeReturn;
  },
  classId: ClassId,
): ClassFlag {
  const inputs = { deviation: formatPercent(wild.risk.standardDeviation) };
  const text = m.classes_flag_volatile_notice({
    ...inputs,
    change: formatSignedPercent(wild.return).text,
  });
  return {
    key: "volatile",
    tone: "loss",
    group: false,
    name: wild.name,
    text: text + inactivity(wild),
    href: flagAddress(classId, wild.id),
  };
}

function holdingsFlag(
  students: readonly TeachingStudent[],
  classId: ClassId,
): ClassFlag | undefined {
  const none = students.filter((student) => student.holdingCount === 0);
  const only = none[0];
  if (only === undefined) return undefined;
  if (none.length === 1) {
    const texts: Record<TeachingStudent["orderHistory"], () => string> = {
      none: m.classes_one_never_held_student_notice,
      unfilled: m.classes_one_unfilled_student_notice,
      filled: m.classes_one_sold_student_notice,
    };
    return {
      key: "no-stocks",
      tone: "idle",
      group: false,
      name: only.name,
      text: texts[only.orderHistory](),
      href: flagAddress(classId, only.id),
    };
  }
  return {
    key: "no-stocks",
    tone: "idle",
    group: true,
    name: m.classes_several_flag_students_label({
      count: formatNumber(none.length),
    }),
    text: m.classes_several_students_without_stocks_notice(),
    href: flagAddress(classId, undefined, "no-stocks"),
  };
}

function inactiveFlag(
  students: readonly TeachingStudent[],
  classId: ClassId,
): ClassFlag | undefined {
  const idle = students.filter((student) => student.ordersThisWeek === 0);
  const first = idle[0];
  if (first === undefined) return undefined;
  const onMap = idle.filter(
    (student) => student.risk !== undefined && student.return !== undefined,
  ).length;
  const group = idle.length > 1;
  const text = group
    ? m.classes_several_inactive_students_notice()
    : m.classes_one_inactive_student_notice();
  return {
    key: "inactive",
    tone: "idle",
    group,
    name: group
      ? m.classes_several_flag_students_label({
          count: formatNumber(idle.length),
        })
      : first.name,
    text: text + mapLocation(onMap, idle.length),
    href: flagAddress(
      classId,
      group ? undefined : first.id,
      group ? "inactive" : "all",
    ),
  };
}

function mapLocation(onMap: number, count: number): string {
  if (onMap === 0) return "";
  if (onMap === count)
    return count === 1
      ? m.classes_one_hollow_point_part()
      : m.classes_several_hollow_points_part();
  return onMap === 1
    ? m.classes_one_idle_map_student_part()
    : m.classes_several_idle_map_students_part({ count: formatNumber(onMap) });
}

function inactivity(student: TeachingStudent): string {
  if (student.ordersThisWeek > 0) return "";
  return student.orderHistory === "none"
    ? m.classes_flag_no_order_part()
    : m.classes_flag_inactive_since_part({ time: student.lastOrder });
}
