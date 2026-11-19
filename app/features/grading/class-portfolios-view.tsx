import { NumberText } from "~/number-text";
import { QuoteNotice } from "~/features/market-data/quote-notice";
import type { ReactNode } from "react";
import { Form } from "react-router";
import { Icon } from "~/icon";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { countedText } from "~/counted-text";
import { formatNumber } from "~/formatting";
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
import { studentsAddress } from "./students-address";
import type { StudentOptions } from "./students-address";
import { ViewLink } from "~/view-link";
import styles from "./grading.module.css";

export function ClassPortfoliosView({
  classId,
  all,
  quoteFailure,
  options,
  shown,
  selected,
  queryFailure,
}: {
  classId: ClassId;
  all: readonly ComparedStudent[];
  quoteFailure: string | undefined;
  options: StudentOptions;
  shown: readonly ComparedStudent[];
  selected: ComparedStudent | undefined;
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
                <ViewLink
                  key={measure}
                  to={studentsAddress(classId, { ...options, measure })}
                  aria-current={
                    options.measure === measure ? "true" : undefined
                  }
                >
                  <span>{rankingLabel(measure)}</span>
                </ViewLink>
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
              <div className={styles["searchField"]}>
                <button
                  type="submit"
                  className={styles["searchSubmit"]}
                  aria-label={m.grading_search_button_label()}
                >
                  <Icon name="search" className={styles["searchIcon"]} />
                </button>
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
              </div>
              {queryFailure !== undefined && (
                <p
                  id="student-search-failure"
                  className={styles["searchFailure"]}
                  role="alert"
                >
                  <NumberText>{queryFailure}</NumberText>
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
                <ViewLink
                  key={filter}
                  to={studentsAddress(classId, { ...options, filter })}
                  aria-current={options.filter === filter ? "true" : undefined}
                >
                  <span>
                    <NumberText>{studentFilterLabel(filter)}</NumberText> ·{" "}
                    <NumberText>
                      {formatNumber(
                        all.filter((student) =>
                          matchesStudentFilter(student, filter),
                        ).length,
                      )}
                    </NumberText>
                  </span>
                </ViewLink>
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
                <i className={styles["tick"]} aria-hidden="true" />
                <NumberText>
                  {m.grading_market_tick_notice({ index: marketIndex.code })}
                </NumberText>
              </p>
              <p>
                <NumberText>
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
                </NumberText>
              </p>
              <div className={styles["ranking"]}>
                <p>
                  <NumberText>
                    {m.grading_ranking_notice({
                      measure: rankingLabel(options.measure),
                    })}
                  </NumberText>
                </p>
                <RankingHelp student={selected} measure={options.measure} />
              </div>
              <p>
                <NumberText>{m.grading_price_times_notice()}</NumberText>
              </p>
              <QuoteNotice text={quoteFailure} className={undefined} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
