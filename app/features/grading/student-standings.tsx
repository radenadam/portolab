import { studentIdentifier } from "~/features/classes/student-identifier";
import { NumberText } from "~/number-text";
import { StudentMeasureNotice } from "./student-measure-notice";
import type { ReactNode } from "react";
import { beta, marketBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import { ChangeText } from "~/change-text";
import { fractionOf, paddedRange } from "~/charts/scale";
import type { Range } from "~/charts/scale";
import {
  formatBeta,
  formatCalendarDate,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { initialsOf } from "~/initials-of";
import { wibDateOf } from "~/wib";
import { m } from "~/paraglide/messages.js";
import {
  rankingLabel,
  rankingText,
  rankingValue,
  studentRank,
} from "./ranking-measure";
import type { ComparedStudent } from "./student-filters";
import type { StudentOptions } from "./students-address";
import { studentRowId, studentsAddress } from "./students-address";
import type { ClassId } from "~/features/classes/classes.schema";
import { StudentLink } from "./student-link";
import styles from "./grading.module.css";

export function StudentStandings({
  classId,
  all,
  shown,
  options,
  selected,
}: {
  classId: ClassId;
  all: readonly ComparedStudent[];
  shown: readonly ComparedStudent[];
  options: StudentOptions;
  selected: ComparedStudent | undefined;
}): ReactNode {
  const returnValues = [cumulativeReturn(0)];
  const betaValues: Beta[] = [marketBeta];
  for (const student of all) {
    if (student.total !== undefined) returnValues.push(student.total.return);
    if (student.marketReturn !== undefined)
      returnValues.push(student.marketReturn);
    if ("measures" in student) betaValues.push(student.measures.beta);
  }
  const returns = paddedRange(returnValues, cumulativeReturn);
  const betas = paddedRange(betaValues, beta);
  return (
    <table className={styles["table"]} data-layout="table">
      <thead>
        <tr>
          <th>
            <span className={styles["rankHeading"]}>
              {m.grading_rank_label()}
            </span>
          </th>
          <th>{m.grading_student_label()}</th>
          <th>{m.grading_short_return_label()}</th>
          <th>{m.grading_short_beta_label()}</th>
          <th>{m.grading_short_risk_label()}</th>
          <th aria-sort="descending">{rankingLabel(options.measure)} ↓</th>
          <th>{m.grading_last_activity_label()}</th>
        </tr>
      </thead>
      <tbody data-layout="rows">
        {shown.map((student) => {
          const value = rankingValue(student, options.measure);
          const reason = value.ok ? undefined : value.failure;
          const rank = studentRank(student, all, options.measure)?.rank;
          return (
            <tr
              data-auto-selected={
                options.studentId === undefined ? "true" : undefined
              }
              key={student.studentId}
              id={studentRowId(student.studentId)}
              className={
                selected?.studentId === student.studentId
                  ? styles["selected"]
                  : undefined
              }
            >
              <td className={styles["rank"]}>
                <NumberText>
                  {rank === undefined ? "" : formatNumber(rank)}
                </NumberText>
              </td>
              <td className={styles["who"]}>
                <StudentLink
                  to={studentsAddress(classId, {
                    ...options,
                    studentId: student.studentId,
                  })}
                  aria-current={
                    options.studentId === student.studentId ? "true" : undefined
                  }
                >
                  <span className={styles["avatar"]} aria-hidden="true">
                    {initialsOf(student.name)}
                  </span>
                  <span className={styles["studentName"]}>
                    <NumberText verbatim>{student.name}</NumberText>
                    <small>
                      <NumberText verbatim>
                        {studentIdentifier(student)}
                      </NumberText>
                    </small>
                  </span>
                </StudentLink>
              </td>
              <StudentNumbers
                student={student}
                options={options}
                returns={returns}
                betas={betas}
              />
              <td className={styles["activityCell"]}>
                <span
                  className={
                    student.activeThisWeek
                      ? styles["active"]
                      : styles["inactive"]
                  }
                  aria-hidden="true"
                >
                  ●
                </span>
                {student.lastActivity === undefined ? (
                  m.grading_never_label()
                ) : (
                  <ActivityTime moment={student.lastActivity} />
                )}
              </td>
              {reason !== undefined && (
                <td className={styles["reasonCell"]}>
                  <details>
                    <summary>{m.grading_missing_measure_label()}</summary>
                    <p>
                      <StudentMeasureNotice student={student} text={reason} />
                    </p>
                  </details>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// The column has room for a day, and the portfolio of the student shows the whole time.
function ActivityTime({ moment }: { moment: Date }): ReactNode {
  const day = wibDateOf(moment);
  return (
    <time dateTime={day}>
      <NumberText>{formatCalendarDate(day, "medium")}</NumberText>
    </time>
  );
}

function InlineScale<Value extends number>({
  range,
  value,
  reference,
  kind,
  toValue,
}: {
  range: Range<Value>;
  value: NoInfer<Value>;
  reference: NoInfer<Value> | undefined;
  kind: "return" | "beta";
  toValue: (value: number) => NoInfer<Value>;
}): ReactNode {
  const position = plotFraction(fractionOf(range, value));
  const zero = plotFraction(fractionOf(range, toValue(0)));
  return (
    <svg className={styles["scale"]} aria-hidden="true">
      <line x1="0" x2="100%" y1="50%" y2="50%" className={styles["track"]} />
      {kind === "return" ? (
        <rect
          x={percentOf(plotFraction(Math.min(position, zero)))}
          y="0.25em"
          width={percentOf(plotFraction(Math.abs(position - zero)))}
          height="0.5em"
          rx="0.125em"
          className={styles[formatSignedPercent(value).direction]}
        />
      ) : (
        <circle
          cx={percentOf(position)}
          cy="50%"
          r="0.3125em"
          className={styles["dot"]}
        />
      )}
      {reference !== undefined && (
        <line
          x1={percentOf(plotFraction(fractionOf(range, reference)))}
          x2={percentOf(plotFraction(fractionOf(range, reference)))}
          y1="0"
          y2="100%"
          className={styles["reference"]}
        />
      )}
    </svg>
  );
}

function StudentNumbers({
  student,
  options,
  returns,
  betas,
}: {
  student: ComparedStudent;
  options: StudentOptions;
  returns: Range<CumulativeReturn>;
  betas: Range<Beta>;
}): ReactNode {
  return (
    <>
      <td className={styles["returnCell"]}>
        {student.total === undefined ? (
          m.grading_unavailable_label()
        ) : (
          <>
            <ChangeText
              change={formatSignedPercent(student.total.return)}
              colored
            />
            <InlineScale
              range={returns}
              value={student.total.return}
              reference={student.marketReturn}
              kind="return"
              toValue={cumulativeReturn}
            />
          </>
        )}
      </td>
      <td className={styles["betaCell"]}>
        {"measures" in student ? (
          <>
            <span>
              <NumberText>{formatBeta(student.measures.beta)}</NumberText>
            </span>
            <InlineScale
              range={betas}
              value={student.measures.beta}
              reference={marketBeta}
              kind="beta"
              toValue={beta}
            />
          </>
        ) : (
          m.grading_unavailable_label()
        )}
      </td>
      <td className={styles["riskCell"]}>
        <NumberText>
          {"measures" in student
            ? formatPercent(student.measures.standardDeviation, "two")
            : m.grading_unavailable_label()}
        </NumberText>
      </td>
      <td className={styles["measureCell"]}>
        <NumberText whole>
          {"measures" in student ? (
            options.measure === "alpha" ? (
              <ChangeText
                change={formatSignedPercent(student.measures.distance)}
                colored
              />
            ) : (
              rankingText(student.measures, options.measure)
            )
          ) : (
            m.grading_unavailable_label()
          )}
        </NumberText>
        <small>{rankingLabel(options.measure)}</small>
      </td>
    </>
  );
}
