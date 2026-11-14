import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { formatNumber } from "~/formatting";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import type { GlossaryTerm, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { glossaryPath, learnPath, lessonPath } from "./learning-paths";
import { lessonLinkText } from "./session-text";
import styles from "./learning.module.css";

export function GlossaryView({
  classId,
  query,
  terms,
  sessions,
  error,
}: {
  classId: ClassId;
  query: string;
  terms: readonly GlossaryTerm[];
  sessions: readonly SessionContent[];
  error: string | undefined;
}): ReactNode {
  const returnPath = glossaryPath(classId, query);
  return (
    <div className={styles["reading"]} data-layout="reading">
      <Link to={learnPath(classId)} className={styles["link"]}>
        <span aria-hidden="true">‹</span>
        {m.learning_back_link()}
      </Link>
      <h1>{m.learning_glossary_title()}</h1>
      <Form
        method="post"
        action={glossaryPath(classId)}
        role="search"
        className={styles["search"]}
      >
        <div className={styles["searchField"]}>
          <label htmlFor="glossary-query" className={styles["visuallyHidden"]}>
            {m.learning_search_hint()}
          </label>
          <button
            type="submit"
            className={styles["searchSubmit"]}
            aria-label={m.learning_search_label()}
          >
            <Icon name="search" className={styles["icon"]} />
          </button>
          <input
            id="glossary-query"
            type="search"
            name="q"
            defaultValue={query}
            key={query}
            placeholder={m.learning_search_hint()}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={error === undefined ? undefined : "query-error"}
          />
        </div>
        {error !== undefined && (
          <p id="query-error" className={styles["error"]} role="alert">
            {error}
          </p>
        )}
      </Form>
      {error === undefined && (
        <>
          {terms.length > 0 && (
            <p className={styles["count"]} role="status">
              {terms.length === 1
                ? m.learning_one_term_notice({
                    count: formatNumber(terms.length),
                  })
                : m.learning_several_terms_notice({
                    count: formatNumber(terms.length),
                  })}
            </p>
          )}
          <div className={styles["glossary"]}>
            {terms.length === 0 && (
              <p className={styles["empty"]} role="status">
                {m.learning_no_terms_notice({ query })}
              </p>
            )}
            {terms.map((term) => {
              return (
                <section
                  key={term.id}
                  id={`term-${term.id}`}
                  className={styles["glossRow"]}
                >
                  <h2>{term.title}</h2>
                  <ContentParagraphs blocks={term.blocks} />
                  {sessions
                    .filter((entry) => entry.session === term.session)
                    .map((lesson) => (
                      <Link
                        key={lesson.session}
                        className={styles["link"]}
                        to={lessonPath(
                          classId,
                          term.session,
                          `${returnPath}#term-${term.id}`,
                        )}
                      >
                        {lessonLinkText(lesson)}
                      </Link>
                    ))}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
