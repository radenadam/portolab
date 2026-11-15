import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import styles from "./form.module.css";

interface DescribedFieldProps {
  /** The id of the control of the field, from which the ids of the hint and the reason follow. */
  id: string;
  label: string;
  hint: string | undefined;
  failure: string | undefined;
  /** The control, which describedBy gives the ids of the hint and the reason. */
  children: ReactNode;
}

/** A reader corrects a refused value in place, so its label, hint, and failure stay with the control. */
export function DescribedField({
  id,
  label,
  hint,
  failure,
  children,
}: DescribedFieldProps): ReactNode {
  return (
    <div className={styles["field"]}>
      <label htmlFor={id} className={styles["label"]}>
        <NumberText>{label}</NumberText>
      </label>
      <FieldFailure id={failureIdOf(id)} text={failure} />
      {children}
      {hint !== undefined && (
        <p id={hintIdOf(id)} className={styles["hint"]}>
          <NumberText>{hint}</NumberText>
        </p>
      )}
    </div>
  );
}

/** The ids of the hint and the reason that describe the control of a field, so a screen reader reads them with it. */
export function describedBy(
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

/** The id of the reason that the value of a field was not accepted, from the id of its control, so that a field that draws its own label, such as a box to tick or a group of options, can name the reason as a description. */
export function failureIdOf(id: string): string {
  return `${id}-failure`;
}

/** The reason that the value of a field was not accepted, or nothing when the value was accepted. */
export function FieldFailure({
  id,
  text,
  quotedValue,
}: {
  id: string;
  text: string | undefined;
  quotedValue?: string;
}): ReactNode {
  // The server sends a finished message, so only the quoted input is text. An unquoted quantity can have the same digits.
  const value = quotedValue?.trim();
  return text === undefined ? null : (
    <p id={id} className={styles["failure"]}>
      <NumberText>
        {(textValue) =>
          value === undefined
            ? text
            : text.replaceAll(`"${value}"`, () => `"${textValue(value)}"`)
        }
      </NumberText>
    </p>
  );
}
