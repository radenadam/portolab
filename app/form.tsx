import { useId } from "react";
import type { ReactNode } from "react";
import styles from "./form.module.css";

interface TextFieldProps {
  name: string;
  label: string;
  type: "text" | "password";
  /** The kind of value, which lets a browser or a password manager fill the field, such as "username" or "new-password". */
  autoComplete: string;
  /** Whether a phone keyboard starts each word with a capital letter, which a name wants and a username or a password does not. */
  capitalizesWords?: boolean;
  /** The keyboard that a phone shows, such as the one with digits for an amount. */
  inputMode?: "text" | "numeric";
  hint?: string | undefined;
  /** Why the value that the form sent was not accepted. */
  failure?: string | undefined;
  defaultValue?: string | undefined;
}

/** A field of a form with its label, a hint, and the reason its value was not accepted. The hint and the reason describe the field, so a screen reader reads them with it. */
export function TextField({
  name,
  label,
  type,
  autoComplete,
  capitalizesWords = false,
  inputMode = "text",
  hint,
  failure,
  defaultValue,
}: TextFieldProps): ReactNode {
  const id = useId();
  const hintId = `${id}-hint`;
  const failureId = `${id}-failure`;
  const describedBy: string[] = [];
  if (hint !== undefined) {
    describedBy.push(hintId);
  }
  if (failure !== undefined) {
    describedBy.push(failureId);
  }
  return (
    <div className={styles["field"]}>
      <label htmlFor={id} className={styles["label"]}>
        {label}
      </label>
      {hint !== undefined && (
        <p id={hintId} className={styles["hint"]}>
          {hint}
        </p>
      )}
      <FieldFailure id={failureId} text={failure} />
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoCapitalize={capitalizesWords ? "words" : "none"}
        inputMode={inputMode}
        spellCheck={false}
        defaultValue={defaultValue}
        aria-invalid={failure !== undefined}
        aria-describedby={
          describedBy.length === 0 ? undefined : describedBy.join(" ")
        }
        className={styles["input"]}
      />
    </div>
  );
}

interface CheckboxFieldProps {
  name: string;
  label: string;
  failure?: string | undefined;
}

/** A box to tick, which the form sends as "yes" when it is ticked. */
export function CheckboxField({
  name,
  label,
  failure,
}: CheckboxFieldProps): ReactNode {
  const id = useId();
  const failureId = `${id}-failure`;
  return (
    <div className={styles["field"]}>
      <FieldFailure id={failureId} text={failure} />
      <div className={styles["checkbox"]}>
        <input
          id={id}
          name={name}
          type="checkbox"
          value="yes"
          aria-invalid={failure !== undefined}
          aria-describedby={failure === undefined ? undefined : failureId}
          className={styles["box"]}
        />
        <label htmlFor={id} className={styles["label"]}>
          {label}
        </label>
      </div>
    </div>
  );
}

export function SubmitButton({ label }: { label: string }): ReactNode {
  return (
    <button type="submit" className={styles["button"]}>
      {label}
    </button>
  );
}

/** A reason that the whole form was not accepted, which a screen reader announces when it appears. */
export function FormFailure({ text }: { text: string }): ReactNode {
  return (
    <p role="alert" className={styles["failure"]}>
      {text}
    </p>
  );
}

/** A result of a form that a screen reader announces when it appears, such as a saved change. */
export function FormSuccess({ text }: { text: string }): ReactNode {
  return (
    <p role="status" className={styles["success"]}>
      {text}
    </p>
  );
}

function FieldFailure({
  id,
  text,
}: {
  id: string;
  text: string | undefined;
}): ReactNode {
  return text === undefined ? null : (
    <p id={id} className={styles["failure"]}>
      {text}
    </p>
  );
}
