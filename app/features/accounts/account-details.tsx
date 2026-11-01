import type { ReactNode } from "react";
import { formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { User } from "./account";
import type { Role } from "./accounts.schema";
import styles from "./account-details.module.css";

const roleNames: Record<Role, () => string> = {
  lecturer: m.accounts_lecturer_role_name,
  student: m.accounts_student_role_name,
};

/** What Portolab stores about the person who is signed in, with the moment when the person agreed to store it. */
export function AccountDetails({
  user,
}: {
  user: Omit<User, "id">;
}): ReactNode {
  return (
    <>
      <dl className={styles["details"]}>
        <dt>{m.accounts_name_label()}</dt>
        <dd>{user.name}</dd>
        <dt>{m.accounts_username_label()}</dt>
        <dd>{user.username}</dd>
        <dt>{m.accounts_role_label()}</dt>
        <dd>{roleNames[user.role]()}</dd>
      </dl>
      <p>
        {m.accounts_consented_notice({
          time: formatMarketTime(user.consentedAt),
        })}
      </p>
    </>
  );
}
