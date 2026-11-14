import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChangeText } from "~/change-text";
import definitionStyles from "~/definition-list.module.css";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatPercent,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "./grading.module.css";
import { studentMeasuresPath, studentPortfolioPath } from "./grading-paths";
import type {
  RankedStudent,
  UnmeasuredStudent,
} from "./read-class-portfolios.server";

/** The students whose portfolios have measures, in the order of their rank, each with the measures that the lecturer compares and the value of the portfolio. */
export function RankedStudents({
  classId,
  students,
}: {
  classId: ClassId;
  students: readonly RankedStudent[];
}): ReactNode {
  return (
    <ol className={styles["list"]}>
      {students.map((student) => (
        <StudentItem
          key={student.studentId}
          classId={classId}
          student={student}
        >
          <dl className={definitionStyles["list"]}>
            <dt>{m.grading_market_line_label()}</dt>
            <dd>
              <ChangeText
                change={formatSignedPercent(student.measures.distance)}
              />
            </dd>
            <dt>{m.grading_expected_return_label()}</dt>
            <dd>
              <NumberText>
                {formatPercent(student.measures.expectedReturn, "two")}
              </NumberText>
            </dd>
            <dt>{m.grading_standard_deviation_label()}</dt>
            <dd>
              <NumberText>
                {formatPercent(student.measures.standardDeviation, "two")}
              </NumberText>
            </dd>
            <dt>
              <NumberText>
                {m.grading_beta_label({ index: marketIndex.code })}
              </NumberText>
            </dt>
            <dd>
              <NumberText>{formatBeta(student.measures.beta)}</NumberText>
            </dd>
            <dt>{m.grading_required_return_label()}</dt>
            <dd>
              <NumberText>
                {formatPercent(student.measures.requiredReturn, "two")}
              </NumberText>
            </dd>
            <TotalRows total={student.total} />
          </dl>
        </StudentItem>
      ))}
    </ol>
  );
}

/** The students whose portfolios have no measures, each with the value of the portfolio when every holding has a delayed price, and why the portfolio has no measures. */
export function UnmeasuredStudents({
  classId,
  students,
}: {
  classId: ClassId;
  students: readonly UnmeasuredStudent[];
}): ReactNode {
  return (
    <ul className={styles["list"]}>
      {students.map((student) => (
        <StudentItem
          key={student.studentId}
          classId={classId}
          student={student}
        >
          {student.total !== undefined && (
            <dl className={definitionStyles["list"]}>
              <TotalRows total={student.total} />
            </dl>
          )}
          <p>
            <NumberText>{student.reason}</NumberText>
          </p>
        </StudentItem>
      ))}
    </ul>
  );
}

function StudentItem({
  classId,
  student,
  children,
}: {
  classId: ClassId;
  student: RankedStudent | UnmeasuredStudent;
  children: ReactNode;
}): ReactNode {
  const { name } = student;
  return (
    <li className={styles["item"]}>
      <p className={styles["name"]}>
        <NumberText>{name}</NumberText>
      </p>
      {children}
      <Link
        to={studentPortfolioPath(classId, student.studentId)}
        className={styles["link"]}
      >
        <NumberText>{m.grading_portfolio_link({ name })}</NumberText>
      </Link>
      <Link
        to={studentMeasuresPath(classId, student.studentId)}
        className={styles["link"]}
      >
        <NumberText>{m.grading_measures_link({ name })}</NumberText>
      </Link>
    </li>
  );
}

function TotalRows({ total }: { total: RankedStudent["total"] }): ReactNode {
  if (total === undefined) {
    return null;
  }
  return (
    <>
      <dt>{m.grading_total_value_label()}</dt>
      <dd>
        <NumberText>{formatRupiah(total.value)}</NumberText>
      </dd>
      <dt>{m.grading_return_label()}</dt>
      <dd>
        <ChangeText change={formatSignedPercent(total.return)} />
      </dd>
    </>
  );
}
