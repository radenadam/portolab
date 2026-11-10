import type { ReactNode } from "react";
import { Link } from "react-router";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import styles from "./grading.module.css";
import {
  classPortfoliosPath,
  studentMeasuresPath,
  studentPortfolioPath,
} from "./grading-paths";

/** A student of a class as the pages of the portfolio of the student show the student to the lecturer of the class. */
export interface TaughtStudent {
  classId: ClassId;
  className: string;
  studentId: UserId;
  name: string;
}

/** The pages of the portfolio of one student that the lecturer of the class reads. */
type StudentPage = "portfolio" | "measures";

const titles: Record<StudentPage, (student: TaughtStudent) => string> = {
  portfolio: (student) =>
    m.grading_student_portfolio_title({
      name: student.name,
      class: student.className,
    }),
  measures: (student) =>
    m.grading_student_measures_title({
      name: student.name,
      class: student.className,
    }),
};

// Each page leads to the other page of the same student.
const otherPages: Record<
  StudentPage,
  (student: TaughtStudent) => { path: string; label: string }
> = {
  portfolio: (student) => ({
    path: studentMeasuresPath(student.classId, student.studentId),
    label: m.grading_measures_link({ name: student.name }),
  }),
  measures: (student) => ({
    path: studentPortfolioPath(student.classId, student.studentId),
    label: m.grading_portfolio_link({ name: student.name }),
  }),
};

/** The meta tags of a page of the portfolio of a student, whose title the first heading of the page repeats. */
export function taughtStudentMeta(
  page: StudentPage,
  student: TaughtStudent,
): { title: string }[] {
  return [{ title: pageTitle(titles[page](student)) }];
}

/** The title of a page of the portfolio of a student, the way back to the portfolios of the class, and the link to the other page of the student. */
export function TaughtStudentHeading({
  page,
  student,
}: {
  page: StudentPage;
  student: TaughtStudent;
}): ReactNode {
  const other = otherPages[page](student);
  return (
    <>
      <h1>{titles[page](student)}</h1>
      <Link
        to={classPortfoliosPath(student.classId)}
        className={styles["link"]}
      >
        {m.grading_all_portfolios_link({ class: student.className })}
      </Link>
      <Link to={other.path} className={styles["link"]}>
        {other.label}
      </Link>
    </>
  );
}
