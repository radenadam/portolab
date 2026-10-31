import type { ReactNode } from "react";
import { isRouteErrorResponse, Link } from "react-router";
import styles from "./error-page.module.css";
import { m } from "./paraglide/messages.js";

interface ErrorPageProps {
  title: string;
  body: string;
}

/** A page that explains why the reader cannot see what they asked for, with a way back to the home page. */
export function ErrorPage({ title, body }: ErrorPageProps): ReactNode {
  return (
    <main className={styles["page"]}>
      {/* An error page has no route meta, so it names itself. React places this title in the head. */}
      <title>{`${title} | ${m.app_name()}`}</title>
      <h1>{title}</h1>
      <p>{body}</p>
      <Link to="/" className={styles["backHome"]}>
        {m.app_back_home_link()}
      </Link>
    </main>
  );
}

/** Chooses the error page for an error that a route threw: the not found page for a 404, and the page for an unexpected failure otherwise. */
export function ErrorScreen({ error }: { error: unknown }): ReactNode {
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  return isNotFound ? (
    <ErrorPage title={m.app_not_found_title()} body={m.app_not_found_body()} />
  ) : (
    <ErrorPage
      title={m.app_unexpected_error_title()}
      body={m.app_unexpected_error_body()}
    />
  );
}
