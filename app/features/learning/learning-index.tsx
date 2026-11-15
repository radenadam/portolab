import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import type { ClassCalendar } from "~/features/classes/course-calendar";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import type { SessionContent } from "./content";
import { cannotPractiseSession, isLessonKind } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { LearningLink } from "./learning-link";
import { glossaryPath, lessonPath } from "./learning-paths";
import { sessionKindLabel, sessionLabel } from "./session-text";
import styles from "./learning.module.css";
import { hasLessonPractice } from "./lesson-practice-sessions";

export function LearningIndex({
  classId,
  sessions,
  calendar,
}: {
  classId: ClassId;
  sessions: readonly SessionContent[];
  calendar: ClassCalendar | undefined;
}): ReactNode {
  return (
    <div className={styles["index"]}>
      <header className={styles["tools"]}>
        <h1>{m.learning_title()}</h1>
        <LearningLink to={glossaryPath(classId)} className={styles["button"]}>
          <Icon name="book" className={styles["icon"]} />
          {m.learning_glossary_link()}
        </LearningLink>
      </header>
      <div className={styles["grid"]} data-layout="columns">
        {sessions.map((lesson) => {
          const current =
            calendar?.week.kind === "session" &&
            calendar.week.session === lesson.session;
          const contents = (
            <>
              <span className={styles["session"]}>
                <span className={styles["badge"]}>
                  <NumberText whole>{sessionLabel(lesson)}</NumberText>
                </span>
                <span>
                  {sessionKindLabel(
                    lesson.kind,
                    current,
                    hasLessonPractice(lesson.session),
                  )}
                </span>
              </span>
              <h2>
                <NumberText>{lesson.title}</NumberText>
              </h2>
              <ContentParagraphs
                blocks={lesson.sections.flatMap((section) =>
                  section.id === "summary" ? section.blocks : [],
                )}
              />
              {cannotPractiseSession(lesson.session) && (
                <span className={styles["foot"]}>
                  {m.learning_unavailable_notice()}
                </span>
              )}
              {hasLessonPractice(lesson.session) && (
                <span className={styles["foot"]}>
                  <Icon name="flask" className={styles["icon"]} />
                  {m.learning_available_practice_notice()}
                </span>
              )}
            </>
          );
          if (isLessonKind(lesson.kind)) {
            return (
              <Link
                key={lesson.session}
                to={lessonPath(classId, lesson.session)}
                className={styles["card"]}
                aria-current={current ? "step" : undefined}
              >
                {contents}
              </Link>
            );
          }
          return (
            <article
              key={lesson.session}
              className={[styles["card"], styles["review"]].join(" ")}
              aria-current={current ? "step" : undefined}
            >
              {contents}
            </article>
          );
        })}
      </div>
    </div>
  );
}
