import type { ReactNode } from "react";
import { TextField } from "~/form";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { sessionCount } from "./course-calendar";

/** The field of the date of session 1 of a class, with the date that it holds and the reason that the date was not accepted. A form with this field sets noValidate, because a browser refuses to send a date that the field holds only in part, with a text of its own in the language of the browser, and the server explains it in the language of the reader instead. */
export function FirstSessionField({
  failure,
  defaultValue,
}: {
  failure: string | undefined;
  defaultValue: string | undefined;
}): ReactNode {
  return (
    <TextField
      name="firstSessionDate"
      label={m.classes_first_session_label()}
      type="date"
      autoComplete="off"
      hint={m.classes_first_session_hint({
        count: formatNumber(sessionCount),
      })}
      failure={failure}
      defaultValue={defaultValue}
    />
  );
}
