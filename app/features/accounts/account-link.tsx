import type { ReactNode } from "react";
import { Link } from "react-router";
import { m } from "~/paraglide/messages.js";
import styles from "./account-link.module.css";

/** The link in the frame to the account of a person who is signed in. A visitor finds the sign-in page in the navigation instead. */
export function AccountLink(): ReactNode {
  return (
    <Link to="/account" className={styles["link"]}>
      {m.accounts_account_link()}
    </Link>
  );
}
