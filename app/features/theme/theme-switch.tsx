import { useId } from "react";
import type { ReactNode } from "react";
import { Form, useLocation } from "react-router";
import { FieldFailure, failureIdOf } from "~/described-field";
import { m } from "~/paraglide/messages.js";
import { themes } from "./theme";
import { themeName } from "./theme-name";
import { useInitialTheme } from "./initial-theme";
import styles from "~/preference-switch.module.css";

export function ThemeSwitch({
  failure,
  quotedValue,
}: {
  failure?: string | undefined;
  quotedValue?: string | undefined;
}): ReactNode {
  const theme = useInitialTheme();
  const location = useLocation();
  const labelId = useId();
  const id = useId();
  const failureId = failureIdOf(id);
  return (
    <Form
      method="post"
      action="/theme"
      reloadDocument
      className={styles["switch"]}
    >
      <input
        type="hidden"
        name="returnTo"
        value={location.pathname + location.search + location.hash}
      />
      <span id={labelId} className={styles["label"]}>
        {m.theme_switch_label()}
      </span>
      <FieldFailure id={failureId} text={failure} quotedValue={quotedValue} />
      <div
        id={id}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={failure === undefined ? undefined : failureId}
        className={styles["options"]}
      >
        {themes.map((choice) => (
          <button
            key={choice}
            type="submit"
            name="theme"
            value={choice}
            aria-pressed={choice === theme}
            className={styles["option"]}
          >
            {themeName(choice)}
          </button>
        ))}
      </div>
    </Form>
  );
}
