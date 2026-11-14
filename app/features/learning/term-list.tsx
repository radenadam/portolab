import type { ReactNode } from "react";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import type { GlossaryTerm } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import styles from "./learning.module.css";

export function TermList({
  terms,
}: {
  terms: readonly GlossaryTerm[];
}): ReactNode {
  return (
    <section className={styles["terms"]} aria-labelledby="key-terms">
      <h2 id="key-terms">{m.learning_key_terms_title()}</h2>
      {terms.map((term) => (
        <details
          key={term.id}
          id={`term-${term.id}`}
          className={styles["term"]}
        >
          <summary>
            <strong>{term.title}</strong>
            <Icon name="chevronDown" className={styles["icon"]} />
          </summary>
          <div className={styles["termBody"]}>
            <ContentParagraphs blocks={term.blocks} />
          </div>
        </details>
      ))}
    </section>
  );
}
