import { useId } from "react";
import type { ReactNode } from "react";
import { Form, useLocation } from "react-router";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { themes } from "./theme";
import { themeName } from "./theme-name";
import { useInitialTheme } from "./initial-theme";
import styles from "~/preference-switch.module.css";

export function ThemeSwitch({
  failure,
}: {
  failure?: string | undefined;
}): ReactNode {
  const theme = useInitialTheme();
  const location = useLocation();
  const labelId = useId();
  const errorId = useId();
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
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={failure === undefined ? undefined : errorId}
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
      {failure !== undefined && (
        <p id={errorId}>
          <NumberText>{failure}</NumberText>
        </p>
      )}
    </Form>
  );
}
