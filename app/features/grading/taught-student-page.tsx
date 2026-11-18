import { classBackLabel } from "~/features/classes/class-back-label";
import { isClassMapPath } from "~/features/classes/class-path";
import { Icon } from "~/icon";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { MarketTime } from "~/market-time";
import { Message } from "~/message";
import { Avatar } from "~/avatar";
import { NumberText } from "~/number-text";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { studentPagePaths, studentPages } from "./grading-paths";
import type { StudentPage } from "./grading-paths";
import styles from "./taught-student.module.css";

export interface TaughtStudent {
  classId: ClassId;
  className: string;
  studentId: UserId;
  name: string;
  shortName: string;
  username: string;
  nim: string | null;
  latestActivity: Date | undefined;
}

const tabLabels: Record<StudentPage, () => string> = {
  portfolio: m.grading_summary_label,
  measures: m.grading_analysis_label,
  journal: m.grading_journal_label,
};

export function taughtStudentMeta(
  page: StudentPage,
): (input: { loaderData: { student: TaughtStudent } }) => { title: string }[] {
  return ({ loaderData: { student } }) => [
    {
      title: pageTitle(
        m.grading_student_page_title({
          name: student.name,
          section: tabLabels[page](),
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
          aria-label={
            isClassMapPath(returnPath, student.classId)
              ? classBackLabel(student.className)
              : m.grading_back_label()
          }
        >
          <Icon name="chevronDown" className={undefined} />
        </Link>
        <Avatar name={student.name} look="own" className={styles["avatar"]} />
        <div className={styles["identity"]}>
          <h1>
            <NumberText verbatim>{student.name}</NumberText>
          </h1>
          <p>
            <IdentityLine student={student} />
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
        {studentPages.map((section) => (
          <Link
            key={section}
            to={pathReturningTo(
              studentPagePaths[section](student.classId, student.studentId),
              returnPath,
            )}
            aria-current={page === section ? "page" : undefined}
          >
            {tabLabels[section]()}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

/** The lecturer knows a student by the NIM that the student gave for the class, as in Mahasiswa, and by the username without one. */
function IdentityLine({ student }: { student: TaughtStudent }): ReactNode {
  const { nim, username, latestActivity } = student;
  if (nim === null) {
    const usernameText = <NumberText verbatim>{username}</NumberText>;
    return latestActivity === undefined ? (
      <Message
        text={m.grading_student_no_activity_notice}
        values={{ username: usernameText }}
      />
    ) : (
      <Message
        text={m.grading_student_activity_notice}
        values={{
          username: usernameText,
          time: <MarketTime moment={latestActivity} />,
        }}
      />
    );
  }
  const nimText = <NumberText verbatim>{nim}</NumberText>;
  return latestActivity === undefined ? (
    <Message
      text={m.grading_student_nim_no_activity_notice}
      values={{ nim: nimText }}
    />
  ) : (
    <Message
      text={m.grading_student_nim_activity_notice}
      values={{ nim: nimText, time: <MarketTime moment={latestActivity} /> }}
    />
  );
}
