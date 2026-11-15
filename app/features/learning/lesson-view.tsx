import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import type { GlossaryTerm, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { learnPath, lessonPath } from "./learning-paths";
import { lessonLinkText, sessionLabel } from "./session-text";
import { TermList } from "./term-list";
import styles from "./learning.module.css";
import { LessonPractice } from "./lesson-practice";
import type { LessonPracticeData } from "./lesson-practice-data";

export function LessonView({
  classId,
  lesson,
  terms,
  previous,
  next,
  returnTo,
  practice,
}: {
  classId: ClassId;
  lesson: SessionContent;
  terms: readonly GlossaryTerm[];
  previous: SessionContent | undefined;
  next: SessionContent | undefined;
  returnTo: string | undefined;
  practice?: LessonPracticeData | undefined;
}): ReactNode {
  return (
    <article className={styles["reading"]} data-layout="reading">
      <header className={styles["hero"]}>
        <Link className={styles["link"]} to={returnTo ?? learnPath(classId)}>
          <span aria-hidden="true">‹</span>
          {returnTo === undefined
            ? m.learning_back_link()
            : m.learning_return_link()}
        </Link>
        <div className={styles["heroRow"]}>
          <span className={styles["badge"]}>
            <NumberText whole>{sessionLabel(lesson)}</NumberText>
          </span>
          {practice !== undefined && (
            <a className={styles["link"]} href="#practice">
              {m.learning_skip_practice_link()} <span aria-hidden>⌄</span>
            </a>
          )}
        </div>
        <h1>
          <NumberText>{lesson.title}</NumberText>
        </h1>
      </header>
      {lesson.sections.map((section) => {
        switch (section.id) {
          case "summary":
            return null;
          case "key-idea":
            return (
              <div key={section.id} className={styles["keyIdea"]}>
                <ContentParagraphs blocks={section.blocks} />
              </div>
            );
          case "body":
            if (practice !== undefined) return null;
            return (
              <div key={section.id} className={styles["body"]}>
                <ContentParagraphs blocks={section.blocks} />
              </div>
            );
          case "unavailable":
            return (
              <div key={section.id} className={styles["note"]}>
                <ContentParagraphs blocks={section.blocks} />
              </div>
            );
          case "terms":
            if (practice !== undefined) return null;
            return <TermList key={section.id} terms={terms} />;
          case "interactive":
            return practice === undefined ? null : (
              <LessonPractice
                key={lesson.session}
                classId={classId}
                lesson={lesson}
                practice={practice}
              >
                <TermList terms={terms} />
              </LessonPractice>
            );
          case "practice":
            return null;
        }
      })}
      <nav
        className={styles["lessonNav"]}
        aria-label={m.learning_lessons_label()}
      >
        {previous !== undefined && (
          <Link
            className={styles["link"]}
            to={lessonPath(classId, previous.session, returnTo)}
          >
            <span aria-hidden="true">‹</span>
            <NumberText>{lessonLinkText(previous)}</NumberText>
          </Link>
        )}
        {next !== undefined && (
          <Link
            className={styles["link"]}
            to={lessonPath(classId, next.session, returnTo)}
          >
            <NumberText>{lessonLinkText(next)}</NumberText>
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
