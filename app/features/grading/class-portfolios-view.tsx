import type { ReactNode } from "react";
import { Form } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { countedText } from "~/counted-text";
import { marketBeta } from "~/units/beta";
import { formatBeta, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { classPortfoliosPath, portfoliosWorkbookPath } from "./grading-paths";
import { RankingHelp } from "./ranking-help";
import { rankingLabel, rankingMeasures } from "./ranking-measure";
import {
  matchesStudentFilter,
  studentFilterLabel,
  studentFilters,
} from "./student-filters";
import type { ComparedStudent } from "./student-filters";
import { StudentStandings } from "./student-standings";
import { StudentPanel } from "./student-panel";
import type { StudentPanelData } from "./student-panel-data.server";
import { studentsAddress } from "./students-address";
import type { StudentOptions } from "./students-address";
import { StudentLink } from "./student-link";
import styles from "./grading.module.css";

export function ClassPortfoliosView({
  classId,
  all,
  quoteFailure,
  options,
  shown,
  selected,
  panel,
  queryFailure,
}: {
  classId: ClassId;
  all: readonly ComparedStudent[];
  quoteFailure: string | undefined;
  options: StudentOptions;
  shown: readonly ComparedStudent[];
  selected: ComparedStudent | undefined;
  panel: StudentPanelData | undefined;
  queryFailure?: string | undefined;
}): ReactNode {
  return (
    <div className={styles["content"]} data-layout="content">
      <div className={styles["students"]} data-layout="columns">
        <div className={styles["column"]}>
          <div className={styles["tools"]}>
            <h1>{m.grading_students_title()}</h1>
            <nav
              className={styles["measures"]}
              aria-label={m.grading_measure_label()}
            >
              {rankingMeasures.map((measure) => (
                <StudentLink
                  key={measure}
                  to={studentsAddress(classId, { ...options, measure })}
                  aria-current={
                    options.measure === measure ? "true" : undefined
                  }
                >
                  <span>{rankingLabel(measure)}</span>
                </StudentLink>
              ))}
            </nav>
            <Form
              method="get"
              action={classPortfoliosPath(classId)}
              className={styles["search"]}
            >
              <input type="hidden" name="measure" value={options.measure} />
              <input type="hidden" name="filter" value={options.filter} />
              {options.studentId !== undefined && (
                <input
                  type="hidden"
                  name="student"
                  value={String(options.studentId)}
                />
              )}
              <input
                aria-invalid={queryFailure !== undefined}
                aria-describedby={
                  queryFailure === undefined
                    ? undefined
                    : "student-search-failure"
                }
                type="search"
                name="q"
                defaultValue={options.query}
                key={options.query}
                placeholder={m.grading_search_label()}
                aria-label={m.grading_search_label()}
              />
              <button type="submit">{m.grading_search_button_label()}</button>
              {queryFailure !== undefined && (
                <p
                  id="student-search-failure"
                  className={styles["searchFailure"]}
                  role="alert"
                >
                  {queryFailure}
                </p>
              )}
            </Form>
            {all.length > 0 && (
              <a
                className={[styles["button"], styles["export"]].join(" ")}
                href={`${portfoliosWorkbookPath(classId)}?measure=${options.measure}`}
                aria-label={m.grading_export_link()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
                </svg>
                <span>{m.grading_export_link()}</span>
              </a>
            )}
          </div>
          <nav
            className={styles["filters"]}
            aria-label={m.grading_filter_label()}
          >
            {studentFilters
              .filter(
                (filter) => filter !== "no-stocks" || options.filter === filter,
              )
              .map((filter) => (
                <StudentLink
                  key={filter}
                  to={studentsAddress(classId, { ...options, filter })}
                  aria-current={options.filter === filter ? "true" : undefined}
                >
                  <span>
                    {studentFilterLabel(filter)} ·{" "}
                    {formatNumber(
                      all.filter((student) =>
                        matchesStudentFilter(student, filter),
                      ).length,
                    )}
                  </span>
                </StudentLink>
              ))}
          </nav>
          <section
            className={styles["listPanel"]}
            aria-label={m.grading_ranking_title()}
          >
            {shown.length > 0 ? (
              <StudentStandings
                classId={classId}
                all={all}
                shown={shown}
                options={options}
                selected={selected}
              />
            ) : (
              <p className={styles["empty"]}>
                {all.length === 0
                  ? m.grading_no_students_body()
                  : m.grading_no_matches_body()}
              </p>
            )}
            <div className={styles["tableNote"]}>
              <p>
                {countedText(
                  all.length,
                  {
                    one: m.grading_one_student_notice,
                    several: m.grading_several_students_notice,
                  },
                  {
                    shown: formatNumber(shown.length),
                    total: formatNumber(all.length),
                  },
                )}
              </p>
              <p>
                {m.grading_ranking_notice({
                  measure: rankingLabel(options.measure),
                })}
              </p>
              <RankingHelp student={selected} measure={options.measure} />
              <p>
                {m.grading_price_times_notice({
                  index: marketIndex.code,
                  beta: formatBeta(marketBeta),
                })}
              </p>
              {quoteFailure !== undefined && <p>{quoteFailure}</p>}
            </div>
          </section>
        </div>
        {selected !== undefined && panel !== undefined && (
          <StudentPanel
            classId={classId}
            student={selected}
            all={all}
            options={options}
            panel={panel}
          />
        )}
      </div>
    </div>
  );
}
