import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./error-page.module.css";
import { m } from "./paraglide/messages.js";

interface ErrorPageProps {
  title: string;
  body: string;
}

/** A page that explains why the reader cannot see what they asked for, with a way back to the home page. */
export function ErrorPage({ title, body }: ErrorPageProps): ReactNode {
  return (
    <>
      {/* An error page has no route meta, so it names itself. React places this title in the head. */}
      <title>{`${title} | ${m.app_name()}`}</title>
      <h1>{title}</h1>
      <p>{body}</p>
      <Link to="/" className={styles["backHome"]}>
        {m.app_back_home_link()}
      </Link>
    </>
  );
}

/** The page for a failure that no route expected. Every unknown address has its own not found page, so a failure here is never a missing page. */
export function UnexpectedErrorPage(): ReactNode {
  return (
    <ErrorPage
      title={m.app_unexpected_error_title()}
      body={m.app_unexpected_error_body()}
    />
  );
}
