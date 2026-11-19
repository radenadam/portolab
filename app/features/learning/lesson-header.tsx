import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { learnPath } from "./learning-paths";
import styles from "./learning.module.css";

/** The head of a page of Belajar, which a sheet shows without its title and with a link to the page instead of the way back. */
export function LessonHeader({
  classId,
  badge,
  title,
  page,
  returnTo,
  inSheet,
  idPrefix,
  hasPractice,
}: {
  classId: ClassId;
  badge: ReactNode;
  title: string;
  /** The page of this content, which a sheet links to. */
  page: string;
  returnTo: string | undefined;
  inSheet: boolean;
  idPrefix: string;
  hasPractice: boolean;
}): ReactNode {
  return (
    <header className={styles["hero"]}>
      {!inSheet && (
        <Link className={styles["link"]} to={returnTo ?? learnPath(classId)}>
          <span aria-hidden="true">‹</span>
          {returnTo === undefined
            ? m.learning_back_link()
            : m.learning_return_link()}
        </Link>
      )}
      <div className={styles[inSheet ? "sheetTools" : "heroRow"]}>
        <span className={styles["badge"]}>{badge}</span>
        {hasPractice && (
          <a
            className={styles["link"]}
            href={`#${idPrefix}practice`}
            onClick={
              inSheet
                ? (event) => {
                    event.preventDefault();
                    document
                      .getElementById(`${idPrefix}practice`)
                      ?.scrollIntoView();
                  }
                : undefined
            }
          >
            {m.learning_skip_practice_link()} <span aria-hidden="true">↓</span>
          </a>
        )}
        {inSheet && (
          <Link className={styles["link"]} to={page}>
            {m.learning_open_lesson_link()} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      {!inSheet && (
        <h1>
          <NumberText>{title}</NumberText>
        </h1>
      )}
    </header>
  );
}
