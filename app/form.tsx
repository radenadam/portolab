import { NumberText } from "~/number-text";
import { useId } from "react";
import type { ReactNode } from "react";
import { useNavigation } from "react-router";
import {
  DescribedField,
  describedBy,
  FieldFailure,
  failureIdOf,
} from "./described-field";
import styles from "./form.module.css";

interface TextFieldProps {
  name: string;
  label: string;
  /** The kind of field. A browser shows a field of a date with a calendar in the language of the device. */
  type: "text" | "password" | "date";
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
  return (
    <DescribedField id={id} label={label} hint={hint} failure={failure}>
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
        aria-describedby={describedBy(id, { hint, failure })}
        className={styles["input"]}
      />
    </DescribedField>
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
  const failureId = failureIdOf(id);
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
          <NumberText>{label}</NumberText>
        </label>
      </div>
    </div>
  );
}

/** An option of a field that offers a choice, with the value that the form sends and the label that the reader sees. */
export interface FieldOption<Value extends string = string> {
  value: Value;
  label: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  /** The label of the first option, which chooses nothing, so that the reader makes the choice. */
  placeholder: string;
  options: readonly FieldOption[];
  hint?: string | undefined;
  failure?: string | undefined;
  defaultValue?: string | undefined;
}

/** A list to choose one value from, with its label, a hint, and the reason its value was not accepted, which a screen reader reads with it. */
export function SelectField({
  name,
  label,
  placeholder,
  options,
  hint,
  failure,
  defaultValue,
}: SelectFieldProps): ReactNode {
  const id = useId();
  return (
    <DescribedField id={id} label={label} hint={hint} failure={failure}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={failure !== undefined}
        aria-describedby={describedBy(id, { hint, failure })}
        className={styles["input"]}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </DescribedField>
  );
}

/** The button that sends its form. Once the app runs in the browser, the button waits while the page changes, because a second tap on a slow network would ask again for what the first one asked, such as a new account. */
export function SubmitButton({
  label,
  className = styles["button"],
}: {
  label: string;
  /** The look of the button where a form stands in another part than a page, such as an item of a menu. */
  className?: string | undefined;
}): ReactNode {
  // After the answer, the next page still loads, and a tap then would send the form again too.
  const isWaiting = useNavigation().state !== "idle";
  return (
    <button type="submit" disabled={isWaiting} className={className}>
      <NumberText>{label}</NumberText>
    </button>
  );
}

/** Whole-form failures need an announcement when an action returns without navigating. */
export function FormFailure({ text }: { text: string }): ReactNode {
  return (
    <p role="alert" className={styles["rejection"]}>
      <NumberText>{text}</NumberText>
    </p>
  );
}

/** A result of a form that a screen reader announces when it appears, such as a saved change. */
export function FormSuccess({ text }: { text: string }): ReactNode {
  return (
    <p role="status" className={styles["success"]}>
      <NumberText verbatim>{text}</NumberText>
    </p>
  );
}
