import type { ReactNode } from "react";
import { Link } from "react-router";
import { LanguageSwitch } from "~/features/language/language-switch";
import { m } from "~/paraglide/messages.js";
import popoverStyles from "~/popover.module.css";
import type { Role } from "./accounts.schema";
import styles from "./profile-menu.module.css";
import { roleName } from "./role-name";
import { SignOutButton } from "./sign-out-button";

/** The menu of the profile of the person who is signed in, which the frame opens from the name and from the avatar: who the person is, the link to the account, the language, and the button that signs out. */
export function ProfileMenu({
  name,
  readerRole,
}: {
  name: string;
  readerRole: Role;
}): ReactNode {
  return (
    <>
      <p className={styles["person"]}>
        <span className={styles["name"]}>{name}</span>
        <span className={styles["role"]}>{roleName(readerRole)}</span>
      </p>
      <hr className={popoverStyles["separator"]} />
      <Link to="/account" className={popoverStyles["item"]}>
        {m.accounts_account_link()}
      </Link>
      <div className={styles["language"]}>
        <LanguageSwitch />
      </div>
      <hr className={popoverStyles["separator"]} />
      <SignOutButton className={popoverStyles["item"]} />
    </>
  );
}
