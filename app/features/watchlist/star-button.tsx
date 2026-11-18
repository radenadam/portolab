import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton } from "~/form";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { watchlistPath } from "./watchlist-path";
import styles from "./star-button.module.css";

export function StarButton({
  classId,
  code,
  watched,
  returnTo,
}: {
  classId: ClassId;
  code: string;
  watched: boolean;
  returnTo: string;
}): ReactNode {
  const label = watched
    ? m.watchlist_remove_label({ code })
    : m.watchlist_add_label({ code });
  return (
    <Form
      method="post"
      action={watchlistPath(classId, code, watched ? "remove" : "add")}
      preventScrollReset
      className={styles["form"]}
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      <SubmitButton
        label={label}
        className={styles["button"]}
        pressed={watched}
      >
        <svg
          viewBox="0 0 24 24"
          fill={watched ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.6-5 2.6 1-5.6-4.1-3.9 5.6-.8z" />
        </svg>
      </SubmitButton>
    </Form>
  );
}
