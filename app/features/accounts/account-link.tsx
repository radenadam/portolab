import type { ReactNode } from "react";
import { Link } from "react-router";
import { m } from "~/paraglide/messages.js";
import styles from "./account-link.module.css";

/** The link in the header to the account of a person who is signed in, or to the sign-in page for a visitor. */
export function AccountLink({
  isSignedIn,
}: {
  isSignedIn: boolean;
}): ReactNode {
  return isSignedIn ? (
    <Link to="/account" className={styles["link"]}>
      {m.accounts_account_link()}
    </Link>
  ) : (
    <Link to="/sign-in" className={styles["link"]}>
      {m.accounts_sign_in_link()}
    </Link>
  );
}
