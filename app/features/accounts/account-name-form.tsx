import type { ReactNode } from "react";
import { Form } from "react-router";
import { FormSuccess, SubmitButton } from "~/form";
import formStyles from "~/form.module.css";
import { m } from "~/paraglide/messages.js";
import type { User } from "./account";
import type { AccountFormFailures } from "./account-fields";
import { NameField } from "./account-form-fields";

/** The answer to the form of the name: when Portolab saved the name, so that the form starts over, and the field as the form then shows it, which holds the name as the rule of names saved it, or the name as the person typed it with the reason that it does not follow the rule. */
export interface NameAnswer {
  savedAt: string | undefined;
  field: Pick<AccountFormFailures, "name" | "nameFailure">;
}

export function AccountNameForm({
  user,
  answer,
}: {
  user: User;
  answer: NameAnswer | undefined;
}): ReactNode {
  return (
    // The form starts over with each save, also when the rule of names saved the stored name again, such as without the spaces around it. React Router gives the page the answer before the loaders read the account again, so the field takes the saved name from the answer.
    <Form
      key={answer?.savedAt ?? "unsaved"}
      method="post"
      className={formStyles["form"]}
    >
      {answer?.savedAt !== undefined && (
        <FormSuccess text={m.accounts_name_changed_notice()} />
      )}
      <NameField
        accountRole={user.role}
        failures={answer?.field ?? { name: user.name, nameFailure: undefined }}
      />
      <SubmitButton label={m.accounts_change_name_label()} />
    </Form>
  );
}
