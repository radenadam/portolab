import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import type { GlossaryTerm, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { lessonPath } from "./learning-paths";
import { LessonHeader } from "./lesson-header";
import { lessonLinkText, sessionLabel } from "./session-text";
import { TermList } from "./term-list";
import styles from "./learning.module.css";
import { LessonPractice } from "./lesson-practice";
import type { LessonPracticeData } from "./lesson-practice-data";
import type { TradingLessonData } from "./trading-lesson-data";
import { LessonTrading } from "./lesson-trading";

export function LessonView({
  classId,
  lesson,
  terms,
  previous,
  next,
  returnTo,
  practice,
  trading,
  inSheet = false,
  idPrefix = "",
}: {
  classId: ClassId;
  lesson: SessionContent;
  terms: readonly GlossaryTerm[];
  previous: SessionContent | undefined;
  next: SessionContent | undefined;
  returnTo: string | undefined;
  practice?: LessonPracticeData | undefined;
  trading?: TradingLessonData | undefined;
  inSheet?: boolean;
  idPrefix?: string;
}): ReactNode {
  const hasInteractive = practice !== undefined || trading !== undefined;
  return (
    <article className={styles["reading"]} data-layout="reading">
      <LessonHeader
        classId={classId}
        badge={<NumberText whole>{sessionLabel(lesson)}</NumberText>}
        title={lesson.title}
        page={lessonPath(classId, lesson.session, returnTo)}
        returnTo={returnTo}
        inSheet={inSheet}
        idPrefix={idPrefix}
        hasPractice={hasInteractive}
      />

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
            if (hasInteractive) return null;
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
            if (hasInteractive) return null;
            return (
              <TermList key={section.id} terms={terms} idPrefix={idPrefix} />
            );
          case "interactive":
            return (
              <LessonActivities
                key={lesson.session}
                classId={classId}
                lesson={lesson}
                terms={terms}
                practice={practice}
                trading={trading}
                idPrefix={idPrefix}
                taskPage={
                  inSheet
                    ? lessonPath(classId, lesson.session, returnTo) +
                      "#practice"
                    : undefined
                }
              />
            );
          case "practice":
            return null;
        }
      })}
      {!inSheet && (
        <LessonNavigation
          classId={classId}
          previous={previous}
          next={next}
          returnTo={returnTo}
        />
      )}
    </article>
  );
}

function LessonNavigation({
  classId,
  previous,
  next,
  returnTo,
}: {
  classId: ClassId;
  previous: SessionContent | undefined;
  next: SessionContent | undefined;
  returnTo: string | undefined;
}): ReactNode {
  return (
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
  );
}

function LessonActivities({
  classId,
  lesson,
  terms,
  practice,
  trading,
  idPrefix,
  taskPage,
}: {
  classId: ClassId;
  lesson: SessionContent;
  terms: readonly GlossaryTerm[];
  practice: LessonPracticeData | undefined;
  trading: TradingLessonData | undefined;
  idPrefix: string;
  taskPage: string | undefined;
}): ReactNode {
  const termList = <TermList terms={terms} idPrefix={idPrefix} />;
  if (trading !== undefined)
    return (
      <LessonTrading
        classId={classId}
        lesson={lesson}
        trading={trading}
        idPrefix={idPrefix}
        taskPage={taskPage}
      >
        {termList}
      </LessonTrading>
    );
  if (practice === undefined) return null;
  return (
    <LessonPractice
      classId={classId}
      lesson={lesson}
      practice={practice}
      idPrefix={idPrefix}
      taskPage={taskPage}
    >
      {termList}
    </LessonPractice>
  );
}
