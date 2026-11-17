import type { ReactNode } from "react";
import { TextField } from "~/form";
import { m } from "~/paraglide/messages.js";
import { studentNimRule } from "./student-nim";

export interface NimFieldValue {
  nim: string;
  nimFailure: string | undefined;
}

export function NimField({
  field,
}: {
  field: NimFieldValue | undefined;
}): ReactNode {
  return (
    <TextField
      name="nim"
      label={m.classes_nim_label()}
      type="text"
      autoComplete="off"
      hint={m.classes_nim_hint(studentNimRule())}
      defaultValue={field?.nim}
      failure={field?.nimFailure}
    />
  );
}
