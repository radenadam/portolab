import { useId } from "react";
import type { ReactNode } from "react";
import { Form, useNavigation } from "react-router";
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
        className={
          inputMode === "numeric" ? styles["numberInput"] : styles["input"]
        }
      />
    </DescribedField>
  );
}

interface TextAreaFieldProps {
  name: string;
  label: string;
  hint: string;
  /** Why the value that the form sent was not accepted. */
  failure: string | undefined;
  defaultValue: string;
}

/** A field of several lines of text, such as the reason of an order, with its label, a hint, and the reason its value was not accepted, which a screen reader reads with it. */
export function TextAreaField({
  name,
  label,
  hint,
  failure,
  defaultValue,
}: TextAreaFieldProps): ReactNode {
  const id = useId();
  return (
    <DescribedField id={id} label={label} hint={hint} failure={failure}>
      <textarea
        id={id}
        name={name}
        rows={3}
        defaultValue={defaultValue}
        aria-invalid={failure !== undefined}
        aria-describedby={describedBy(id, { hint, failure })}
        className={styles["textArea"]}
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

/** A group of options of which the reader chooses one, with the label of the group and the reason that the choice was not accepted, which a screen reader reads with the group. The options stand in a row of equal parts, and the chosen one carries a line of the signal color, as decision 0026 sets. */
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
      <div className={styles["options"]}>
        {options.map((option) => (
          <label key={option.value} className={styles["option"]}>
            <input
              name={name}
              type="radio"
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className={styles["optionInput"]}
            />
            {option.label}
          </label>
        ))}
      </div>
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

/** A reason that the whole form was not accepted, which a screen reader announces when it appears. It opens with the line of ink of a rejection, as decision 0026 sets for every failure. */
export function FormFailure({ text }: { text: string }): ReactNode {
  return (
    <p role="alert" className={styles["rejection"]}>
      {text}
    </p>
  );
}

/** A rejection of a whole form, as decision 0026 draws it: a line of ink, a title, the text, and the control of the next step when Portolab can take it, such as a button that changes the order to the largest one that the cash pays for. A screen reader announces it when it appears. */
export function Rejection({
  title,
  text,
  step,
}: {
  title: string;
  text: string;
  step: ReactNode;
}): ReactNode {
  return (
    <div role="alert" className={styles["rejection"]}>
      <p className={styles["rejectionTitle"]}>{title}</p>
      <p>{text}</p>
      {step}
    </div>
  );
}

/** The button of a rejection that takes the next step that its text offers, in a form of its own that sends the step with the fields that the rejected form sent, so it works before JavaScript loads. A form sends with its first submit button when the reader presses Enter in a field, so the step never shares a form with the button that sends the fields. */
export function StepForm({
  fields,
  step,
  label,
}: {
  /** The fields that the rejected form sent, by name, which the step keeps. */
  fields: Readonly<Record<string, string>>;
  /** The name and the value of the step, which the action answers. */
  step: { name: string; value: string };
  label: string;
}): ReactNode {
  return (
    <Form method="post">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        name={step.name}
        value={step.value}
        className={styles["stepButton"]}
      >
        {label}
      </button>
    </Form>
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
