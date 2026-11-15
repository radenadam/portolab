import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useFetcher } from "react-router";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { loader as lessonLoader } from "./lesson-page";
import type {
  loader as glossaryLoader,
  action as glossaryAction,
} from "./glossary-page";
import { LessonView } from "./lesson-view";
import { GlossaryView } from "./glossary-view";
import styles from "./learning-sheet.module.css";

export function LearningSheet({
  address,
  onClose,
}: {
  address: string;
  onClose: () => void;
}): ReactNode {
  const fetcher = useFetcher<
    typeof lessonLoader | typeof glossaryLoader | typeof glossaryAction
  >();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const load = fetcher.load;
  function close() {
    dialogRef.current?.close();
  }
  useEffect(() => {
    void load(address);
  }, [address, load]);
  const content = fetcher.data;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (content !== undefined && dialog !== null && !dialog.open)
      dialog.showModal();
  }, [content]);
  useEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      dialog?.close();
    };
  }, []);
  const title =
    content !== undefined && "lesson" in content
      ? content.lesson.title
      : m.learning_glossary_title();
  useEffect(() => {
    if (content === undefined) return;
    const fragment = new URL(address, window.location.origin).hash.slice(1);
    const target = [
      ...(dialogRef.current?.querySelectorAll("[id]") ?? []),
    ].find((element) => element.id === `${titleId}${fragment}`);
    target?.scrollIntoView({ block: "center" });
  }, [address, content, titleId]);
  return (
    <dialog
      ref={dialogRef}
      className={
        styles[
          content !== undefined && "lesson" in content ? "lesson" : "glossary"
        ]
      }
      aria-labelledby={titleId}
      closedby="any"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={onClose}
    >
      <div className={styles["grip"]} aria-hidden="true" />
      <header className={styles["head"]}>
        <h2 id={titleId}>
          <NumberText>{title}</NumberText>
        </h2>
        <button
          type="button"
          className={styles["close"]}
          aria-label={m.learning_sheet_close_label()}
          onClick={close}
        >
          ×
        </button>
      </header>
      <div className={styles["body"]} aria-busy={fetcher.state !== "idle"}>
        {content !== undefined &&
          ("lesson" in content ? (
            <LessonView {...content} inSheet idPrefix={titleId} />
          ) : (
            <GlossaryView
              {...content}
              inSheet
              idPrefix={titleId}
              searchForm={fetcher.Form}
            />
          ))}
      </div>
    </dialog>
  );
}
