import { useId } from "react";
import type { ReactNode } from "react";
import { m } from "./paraglide/messages.js";
import { Popover, PopoverButton } from "./popover";
import styles from "./concept-card.module.css";

/** Native popovers and details keep help available before JavaScript loads. */
export function ConceptCard({
  title,
  meaning,
  example,
  calculation,
  lesson,
}: {
  title: string;
  meaning: string;
  example: ReactNode;
  calculation: ReactNode;
  lesson: ReactNode;
}): ReactNode {
  return (
    <ConceptHelp title={title}>
      <p>{meaning}</p>
      <div className={styles["example"]}>
        <p className={styles["label"]}>{m.app_concept_example_label()}</p>
        {example}
      </div>
      <details>
        <summary>{m.app_concept_calculation_label()}</summary>
        <div className={styles["calculation"]}>{calculation}</div>
      </details>
      <p className={styles["lesson"]}>{lesson}</p>
    </ConceptHelp>
  );
}

/** Contextual help and measured concepts share the native question button and its card. */
export function ConceptHelp({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  const id = `concept-${useId().replaceAll(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <PopoverButton
        popover={id}
        label={m.app_concept_help_label({ concept: title })}
        className={styles["question"]}
      >
        <span aria-hidden="true">?</span>
      </PopoverButton>
      <Popover id={id} label={title} placement="belowEnd">
        <div className={styles["card"]}>
          <p className={styles["title"]}>{title}</p>
          {children}
        </div>
      </Popover>
    </>
  );
}
