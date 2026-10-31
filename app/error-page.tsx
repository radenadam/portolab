import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./error-page.module.css";
import { PageTitle } from "./page-title";
import { m } from "./paraglide/messages.js";

interface ErrorPageProps {
  title: string;
  body: string;
}

/** The content of a page that explains why the reader cannot see what they asked for, with a way back to the home page. Its caller sets the title of the page. */
export function ErrorPage({ title, body }: ErrorPageProps): ReactNode {
  return (
    <>
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
    <>
      <PageTitle text={m.app_unexpected_error_title()} />
      <ErrorPage
        title={m.app_unexpected_error_title()}
        body={m.app_unexpected_error_body()}
      />
    </>
  );
}
