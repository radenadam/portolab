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

export function LessonView({
  classId,
  lesson,
  terms,
  previous,
  next,
  returnTo,
}: {
  classId: ClassId;
  lesson: SessionContent;
  terms: readonly GlossaryTerm[];
  previous: SessionContent | undefined;
  next: SessionContent | undefined;
  returnTo: string | undefined;
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
        <span className={styles["badge"]}>{sessionLabel(lesson)}</span>
        <h1>{lesson.title}</h1>
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
            return (
              <section
                key={section.id}
                className={styles["body"]}
                aria-labelledby="key-idea-title"
              >
                <h2 id="key-idea-title">{m.learning_key_idea_title()}</h2>
                <ContentParagraphs blocks={section.blocks} />
              </section>
            );
          case "unavailable":
            return (
              <div key={section.id} className={styles["note"]}>
                <ContentParagraphs blocks={section.blocks} />
              </div>
            );
          case "terms":
            return <TermList key={section.id} terms={terms} />;
          case "interactive":
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
            {lessonLinkText(previous)}
          </Link>
        )}
        {next !== undefined && (
          <Link
            className={styles["link"]}
            to={lessonPath(classId, next.session, returnTo)}
          >
            {lessonLinkText(next)}
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
