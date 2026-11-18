import type { ReactNode } from "react";
import { Form } from "react-router";
import { FormSuccess, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { NimAnswer } from "./change-student-nim.server";
import type { JoinedClass } from "./class-store.server";
import { NimField } from "./nim-field";

export function ClassNimForm({
  joined,
  answer,
}: {
  joined: JoinedClass;
  answer: NimAnswer | undefined;
}): ReactNode {
  const ownAnswer = answer?.classId === joined.id ? answer : undefined;
  return (
    <section className={formStyles["panel"]}>
      <h2>
        <NumberText verbatim>
          {m.classes_class_nim_title({ class: joined.name })}
        </NumberText>
      </h2>
      <Form
        key={ownAnswer?.savedAt ?? "unsaved"}
        method="post"
        className={formStyles["form"]}
      >
        <input type="hidden" name="classId" value={joined.id} />
        {ownAnswer?.savedAt !== undefined && (
          <FormSuccess
            text={
              ownAnswer.nim === ""
                ? m.classes_nim_cleared_notice()
                : m.classes_nim_changed_notice()
            }
          />
        )}
        <NimField
          field={ownAnswer ?? { nim: joined.nim ?? "", nimFailure: undefined }}
        />
        <SubmitButton label={m.classes_change_nim_label()} />
      </Form>
    </section>
  );
}
