import type { ReactNode } from "react";
import { Form } from "react-router";
import { FormFailure, SubmitButton, TextField } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import type { CodeFailure } from "./find-class-with-code.server";

/** The form in which a person enters the code of a class, with the code that the person typed and why it opened no class. A wrong code is a failure of the field, and a block of the network is a failure of the whole form. Both /join and an address with a wrong code show it, and it always posts to /join. */
export function CodeForm({
  code,
  failure,
}: {
  code: string | undefined;
  failure: CodeFailure | undefined;
}): ReactNode {
  const { fieldFailure, formFailure } = failurePlaces(failure);
  return (
    <>
      <p>{m.classes_join_body()}</p>
      <Form method="post" action="/join" className={formStyles["form"]}>
        {formFailure !== undefined && <FormFailure text={formFailure} />}
        <TextField
          name="code"
          label={m.classes_code_label()}
          type="text"
          autoComplete="off"
          failure={fieldFailure}
          defaultValue={code}
        />
        <SubmitButton label={m.classes_continue_label()} />
      </Form>
    </>
  );
}

function failurePlaces(failure: CodeFailure | undefined): {
  fieldFailure: string | undefined;
  formFailure: string | undefined;
} {
  switch (failure?.kind) {
    case "wrongCode":
      return { fieldFailure: failure.text, formFailure: undefined };
    case "blocked":
      return { fieldFailure: undefined, formFailure: failure.text };
    case undefined:
      return { fieldFailure: undefined, formFailure: undefined };
  }
}
