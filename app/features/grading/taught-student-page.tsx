import { Icon } from "~/icon";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { MarketTime } from "~/market-time";
import { initialsOf } from "~/initials-of";
import { NumberText } from "~/number-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import {
  studentMeasuresPath,
  studentPortfolioPath,
  studentJournalPath,
} from "./grading-paths";
import styles from "./taught-student.module.css";

export interface TaughtStudent {
  classId: ClassId;
  className: string;
  studentId: UserId;
  name: string;
  shortName: string;
  username: string;
  latestActivity: Date | undefined;
}

const pages = ["portfolio", "measures", "journal"] as const;
type StudentPage = (typeof pages)[number];
const tabs: Record<
  StudentPage,
  { label: () => string; path: typeof studentPortfolioPath }
> = {
  portfolio: { label: m.grading_summary_label, path: studentPortfolioPath },
  measures: { label: m.grading_analysis_label, path: studentMeasuresPath },
  journal: { label: m.grading_journal_label, path: studentJournalPath },
};

export function taughtStudentMeta(
  page: StudentPage,
): (input: { loaderData: { student: TaughtStudent } }) => { title: string }[] {
  return ({ loaderData: { student } }) => [
    {
      title: pageTitle(
        m.grading_student_page_title({
          name: student.name,
          section: tabs[page].label(),
          class: student.className,
        }),
      ),
    },
  ];
}

export function TaughtStudentPage({
  page,
  student,
  returnPath,
  children,
}: {
  page: StudentPage;
  student: TaughtStudent;
  returnPath: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["page"]}>
      <header className={styles["header"]}>
        <Link
          to={returnPath}
          className={styles["back"]}
          aria-label={m.grading_back_label()}
        >
          <Icon name="chevronDown" className={undefined} />
        </Link>
        <span className={styles["avatar"]} aria-hidden>
          {initialsOf(student.name)}
        </span>
        <div className={styles["identity"]}>
          <h1>
            <NumberText verbatim>{student.name}</NumberText>
          </h1>
          <p>
            <NumberText verbatim>
              {m.grading_student_username_label({ username: student.username })}
            </NumberText>
            {" · "}
            {m.grading_last_activity_label()}{" "}
            {student.latestActivity === undefined ? (
              m.grading_never_label()
            ) : (
              <MarketTime moment={student.latestActivity} />
            )}
          </p>
        </div>
      </header>
      <p className={styles["notice"]}>
        <Icon name="eye" className={undefined} />
        {m.grading_read_only_notice()}
      </p>
      <nav
        className={styles["tabs"]}
        aria-label={m.grading_student_sections_label()}
      >
        {pages.map((section) => (
          <Link
            key={section}
            to={pathReturningTo(
              tabs[section].path(student.classId, student.studentId),
              returnPath,
            )}
            aria-current={page === section ? "page" : undefined}
          >
            {tabs[section].label()}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
