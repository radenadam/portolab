import { useId } from "react";
import type { ReactNode } from "react";
import { useNavigation } from "react-router";
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
          {label}
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

interface ChoiceFieldProps {
  name: string;
  label: string;
  options: readonly FieldOption[];
  failure?: string | undefined;
  defaultValue?: string | undefined;
}

/** A group of options of which the reader chooses one, with the label of the group and the reason that the choice was not accepted, which a screen reader reads with the group. */
export function ChoiceField({
  name,
  label,
  options,
  failure,
  defaultValue,
}: ChoiceFieldProps): ReactNode {
  const id = useId();
  const failureId = failureIdOf(id);
  return (
    <fieldset
      aria-describedby={failure === undefined ? undefined : failureId}
      className={styles["choices"]}
    >
      <legend className={styles["label"]}>{label}</legend>
      <FieldFailure id={failureId} text={failure} />
      {options.map((option) => (
        <div key={option.value} className={styles["checkbox"]}>
          <input
            id={`${id}-${option.value}`}
            name={name}
            type="radio"
            value={option.value}
            defaultChecked={option.value === defaultValue}
            className={styles["box"]}
          />
          <label htmlFor={`${id}-${option.value}`}>{option.label}</label>
        </div>
      ))}
    </fieldset>
  );
}

/** The button that sends its form. Once the app runs in the browser, the button waits while the page changes, because a second tap on a slow network would ask again for what the first one asked, such as a new account. */
export function SubmitButton({ label }: { label: string }): ReactNode {
  // After the answer, the next page still loads, and a tap then would send the form again too.
  const isWaiting = useNavigation().state !== "idle";
  return (
    <button type="submit" disabled={isWaiting} className={styles["button"]}>
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

interface DescribedFieldProps {
  /** The id of the control of the field, from which the ids of the hint and the reason follow. */
  id: string;
  label: string;
  hint: string | undefined;
  failure: string | undefined;
  /** The control, which describedBy gives the ids of the hint and the reason. */
  children: ReactNode;
}

/** A field with its label, its hint, and the reason that its value was not accepted, above its control. */
function DescribedField({
  id,
  label,
  hint,
  failure,
  children,
}: DescribedFieldProps): ReactNode {
  return (
    <div className={styles["field"]}>
      <label htmlFor={id} className={styles["label"]}>
        {label}
      </label>
      {hint !== undefined && (
        <p id={hintIdOf(id)} className={styles["hint"]}>
          {hint}
        </p>
      )}
      <FieldFailure id={failureIdOf(id)} text={failure} />
      {children}
    </div>
  );
}

/** The ids of the hint and the reason that describe the control of a field, so a screen reader reads them with it. */
function describedBy(
  id: string,
  { hint, failure }: { hint: string | undefined; failure: string | undefined },
): string | undefined {
  const ids: string[] = [];
  if (hint !== undefined) {
    ids.push(hintIdOf(id));
  }
  if (failure !== undefined) {
    ids.push(failureIdOf(id));
  }
  return ids.length === 0 ? undefined : ids.join(" ");
}

function hintIdOf(id: string): string {
  return `${id}-hint`;
}

function failureIdOf(id: string): string {
  return `${id}-failure`;
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
