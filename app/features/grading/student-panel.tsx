import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { ChangeText } from "~/change-text";
import type { StudentPanelData } from "./student-panel-data.server";
import { LatestStudentReason } from "./latest-student-reason";
import { StudentLink } from "./student-link";
import { studentRank } from "./ranking-measure";
import type { RankingMeasure } from "./ranking-measure";
import { StudentMap } from "./student-map";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { initialsOf } from "~/initials-of";
import { m } from "~/paraglide/messages.js";
import { portfolioWeightOf } from "~/features/trading/portfolio-weight-of";
import { studentMeasuresPath, studentPortfolioPath } from "./grading-paths";
import type { ComparedStudent } from "./student-filters";
import { studentNote } from "./student-note";
import {
  selectedStudentHeadingId,
  studentRowId,
  studentsAddress,
} from "./students-address";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { StudentOptions } from "./students-address";
import styles from "./grading.module.css";

export function StudentPanel({
  classId,
  student,
  all,
  options,
  panel,
}: {
  classId: ClassId;
  student: ComparedStudent;
  all: readonly ComparedStudent[];
  options: StudentOptions;
  panel: StudentPanelData;
}): ReactNode {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastSelectionRef = useRef<UserId | undefined>(undefined);
  const navigate = useNavigate();
  const returnAddress = studentsAddress(classId, {
    ...options,
    studentId: student.studentId,
  });
  const closeDestination = studentsAddress(classId, {
    ...options,
    studentId: undefined,
  });
  const closePath = closeDestination + `#${studentRowId(student.studentId)}`;
  useEffect(() => {
    const element = dialogRef.current;
    if (element === null) return;
    const media = window.matchMedia("(min-width: 82.5rem)");
    const place = (): void => {
      if (options.studentId === undefined) {
        element.open = true;
        const previous = lastSelectionRef.current;
        lastSelectionRef.current = undefined;
        if (previous !== undefined) {
          const row = document.getElementById(studentRowId(previous));
          row?.querySelector("a")?.focus({ preventScroll: true });
          row?.scrollIntoView({ block: "nearest" });
        }
        return;
      }
      lastSelectionRef.current = options.studentId;
      element.close();
      if (media.matches) element.open = true;
      else element.showModal();
    };
    place();
    media.addEventListener("change", place);
    return () => {
      media.removeEventListener("change", place);
      element.close();
    };
  }, [options.studentId]);
  const value = panel.valuation.total;
  return (
    <dialog
      ref={dialogRef}
      open
      className={[
        styles["studentPanel"],
        options.studentId === undefined ? styles["automaticPanel"] : "",
      ].join(" ")}
      aria-labelledby={selectedStudentHeadingId}
      onCancel={(event) => {
        event.preventDefault();
        void navigate(closeDestination, { preventScrollReset: true });
      }}
    >
      <div className={styles["panelContents"]}>
        <div className={styles["panelHeader"]}>
          <span className={styles["avatar"]} aria-hidden="true">
            {initialsOf(student.name)}
          </span>
          <div>
            <h2 id={selectedStudentHeadingId}>{student.name}</h2>
            <small>
              {student.username}
              <StudentRank
                student={student}
                all={all}
                measure={options.measure}
              />
            </small>
          </div>
          <StudentLink
            to={closePath}
            className={styles["close"]}
            aria-label={m.grading_close_label()}
          >
            ×
          </StudentLink>
        </div>
        {"measures" in student &&
          student.total !== undefined &&
          student.marketReturn !== undefined && (
            <StudentMap
              student={student}
              all={all}
              marketReturn={student.marketReturn}
            />
          )}
        <MapNotice student={student} />
        <dl className={styles["keyValues"]}>
          <div>
            <dt>{m.grading_short_return_label()}</dt>
            <dd>
              {student.total === undefined ? (
                m.grading_unavailable_label()
              ) : (
                <ChangeText
                  change={formatSignedPercent(student.total.return)}
                  colored
                />
              )}
            </dd>
          </div>
          <div>
            <dt>{m.grading_short_beta_label()}</dt>
            <dd>
              {"measures" in student
                ? formatBeta(student.measures.beta)
                : m.grading_unavailable_label()}
            </dd>
          </div>
          <div>
            <dt>{m.grading_risk_label()}</dt>
            <dd>
              {"measures" in student
                ? formatPercent(student.measures.standardDeviation, "two")
                : m.grading_unavailable_label()}
            </dd>
          </div>
          <div>
            <dt>{m.grading_market_line_label()}</dt>
            <dd>
              {"measures" in student ? (
                <ChangeText
                  change={formatSignedPercent(student.measures.distance)}
                  colored
                />
              ) : (
                m.grading_unavailable_label()
              )}
            </dd>
          </div>
          <div>
            <dt>{m.grading_total_value_label()}</dt>
            <dd>
              {student.total === undefined
                ? m.grading_unavailable_label()
                : formatRupiah(student.total.value, "compact")}
            </dd>
          </div>
          <div>
            <dt>{m.grading_orders_label()}</dt>
            <dd>{formatNumber(panel.orderCount)}</dd>
          </div>
        </dl>
        <p className={styles["note"]}>{studentNote(student, all)}</p>
        {value !== undefined && value.value > 0 && (
          <div className={styles["allocation"]}>
            <div className={styles["allocationBar"]} aria-hidden="true">
              {panel.valuation.holdings.map(
                (holding) =>
                  holding.kind === "priced" && (
                    <i key={holding.code} style={{ flexGrow: holding.value }} />
                  ),
              )}
              <i
                className={styles["cash"]}
                style={{ flexGrow: panel.valuation.cash }}
              />
            </div>
            <p>
              {panel.valuation.holdings.map(
                (holding) =>
                  holding.kind === "priced" && (
                    <span key={holding.code}>
                      {holding.code}{" "}
                      {formatPercent(
                        portfolioWeightOf(holding.value, value.value),
                        "two",
                      )}{" "}
                      ·{" "}
                    </span>
                  ),
              )}
              {m.grading_cash_label()}{" "}
              {formatPercent(
                portfolioWeightOf(panel.valuation.cash, value.value),
                "two",
              )}
            </p>
          </div>
        )}
        <LatestStudentReason reason={panel.reason} />
        <div className={styles["panelActions"]}>
          <Link
            className={styles["primary"]}
            to={pathReturningTo(
              studentPortfolioPath(classId, student.studentId),
              returnAddress,
            )}
          >
            {m.grading_open_portfolio_link()}
          </Link>
          <Link
            className={styles["button"]}
            to={pathReturningTo(
              studentMeasuresPath(classId, student.studentId),
              returnAddress,
            )}
          >
            {m.grading_open_analysis_link()}
          </Link>
          <Link
            className={styles["button"]}
            to={`${pathReturningTo(studentPortfolioPath(classId, student.studentId), returnAddress)}#student-reasons`}
          >
            {m.grading_journal_link()}
          </Link>
          <Link
            className={styles["link"]}
            to={pathReturningTo(
              studentPortfolioPath(classId, student.studentId).replace(
                /portfolio$/,
                "password",
              ),
              returnAddress,
            )}
          >
            {m.grading_reset_link()}
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function MapNotice({ student }: { student: ComparedStudent }): ReactNode {
  if (!("measures" in student) || student.marketReturn !== undefined)
    return null;
  return (
    <p className={styles["details"]}>{m.grading_map_unavailable_notice()}</p>
  );
}

function StudentRank({
  student,
  all,
  measure,
}: {
  student: ComparedStudent;
  all: readonly ComparedStudent[];
  measure: RankingMeasure;
}): ReactNode {
  const rank = studentRank(student, all, measure);
  return rank === undefined
    ? m.grading_unranked_notice()
    : m.grading_rank_notice({
        rank: formatNumber(rank.rank),
        total: formatNumber(rank.total),
      });
}
