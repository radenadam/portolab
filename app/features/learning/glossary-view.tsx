import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Form, Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { formatNumber } from "~/formatting";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import { pathWithQuery } from "~/path-with-query";
import type { GlossaryTerm, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import { glossaryPath, learnPath, lessonPath } from "./learning-paths";
import { LearningLink } from "./learning-link";
import { lessonLinkText } from "./session-text";
import styles from "./learning.module.css";

export function GlossaryView({
  classId,
  query,
  terms,
  sessions,
  error,
  returnTo,
  inSheet = false,
  idPrefix = "",
  searchForm: SearchForm = Form,
}: {
  classId: ClassId;
  query: string;
  terms: readonly GlossaryTerm[];
  sessions: readonly SessionContent[];
  error: string | undefined;
  returnTo?: string | undefined;
  inSheet?: boolean;
  idPrefix?: string;
  searchForm?: typeof Form;
}): ReactNode {
  const returnPath = glossaryPath(classId, query, returnTo);
  return (
    <div className={styles["reading"]} data-layout="reading">
      <GlossaryHeading
        classId={classId}
        returnTo={returnTo}
        inSheet={inSheet}
      />
      <SearchForm
        method="post"
        action={pathWithQuery(glossaryPath(classId), {
          inPlace: inSheet ? "" : undefined,
        })}
        role="search"
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className={styles["searchField"]}>
          <button
            type="submit"
            className={styles["searchSubmit"]}
            aria-label={m.learning_search_label()}
          >
            <Icon name="search" className={styles["icon"]} />
          </button>
          <input
            type="search"
            name="q"
            aria-label={m.learning_search_hint()}
            defaultValue={query}
            key={query}
            placeholder={m.learning_search_hint()}
            aria-invalid={error === undefined ? undefined : true}
            aria-describedby={
              error === undefined ? undefined : `${idPrefix}query-error`
            }
          />
        </div>
        {error !== undefined && (
          <p
            id={`${idPrefix}query-error`}
            className={styles["error"]}
            role="alert"
          >
            <NumberText>{error}</NumberText>
          </p>
        )}
      </SearchForm>
      {error === undefined && (
        <>
          {terms.length > 0 && (
            <p className={styles["count"]} role="status">
              <NumberText>
                {terms.length === 1
                  ? m.learning_one_term_notice({
                      count: formatNumber(terms.length),
                    })
                  : m.learning_several_terms_notice({
                      count: formatNumber(terms.length),
                    })}
              </NumberText>
            </p>
          )}
          <div className={styles["glossary"]}>
            {terms.length === 0 && (
              <p className={styles["empty"]} role="status">
                <NumberText verbatim>
                  {m.learning_no_terms_notice({ query })}
                </NumberText>
              </p>
            )}
            {terms.map((term) => {
              return (
                <section
                  key={term.id}
                  id={`${idPrefix}term-${term.id}`}
                  className={styles["glossRow"]}
                >
                  <h2>
                    <NumberText>{term.title}</NumberText>
                  </h2>
                  <ContentParagraphs blocks={term.blocks} />
                  {sessions
                    .filter((entry) => entry.session === term.session)
                    .map((lesson) => (
                      <LearningLink
                        key={lesson.session}
                        className={styles["link"]}
                        to={lessonPath(
                          classId,
                          term.session,
                          `${returnPath}#term-${term.id}`,
                        )}
                      >
                        <NumberText>{lessonLinkText(lesson)}</NumberText>
                      </LearningLink>
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

function GlossaryHeading({
  classId,
  returnTo,
  inSheet,
}: {
  classId: ClassId;
  returnTo: string | undefined;
  inSheet: boolean;
}): ReactNode {
  if (inSheet) return null;
  return (
    <>
      <Link to={returnTo ?? learnPath(classId)} className={styles["link"]}>
        <span aria-hidden="true">‹</span>
        {returnTo === undefined
          ? m.learning_back_link()
          : m.learning_return_link()}
      </Link>
      <h1>{m.learning_glossary_title()}</h1>
    </>
  );
}
