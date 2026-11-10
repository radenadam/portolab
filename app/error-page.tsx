import type { ReactNode } from "react";
import { isRouteErrorResponse, Link } from "react-router";
import styles from "./error-page.module.css";
import { PageTitle } from "./page-title";
import { m } from "./paraglide/messages.js";

interface ErrorPageProps {
  title: string;
  body: string;
  /** The control for the next step that the body offers, such as a button that signs out, in place of the way back to the home page. */
  nextStep?: ReactNode;
}

/** The content of a page that explains why the reader cannot see what they asked for, with a way back to the home page or the next step that its body offers. Its caller sets the title of the page. */
export function ErrorPage({
  title,
  body,
  nextStep,
}: ErrorPageProps): ReactNode {
  return (
    <>
      <h1>{title}</h1>
      <p>{body}</p>
      {nextStep ?? <NextStepLink to="/" label={m.app_back_home_link()} />}
    </>
  );
}

/** A link to the next step that an error page offers, such as the way back to the home page. */
export function NextStepLink({
  to,
  label,
}: {
  to: string;
  label: string;
}): ReactNode {
  return (
    <Link to={to} className={styles["nextStepLink"]}>
      {label}
    </Link>
  );
}

/** The content of the page for an address that does not exist, or that the reader may not see. */
export function MissingPageContent(): ReactNode {
  return (
    <ErrorPage title={m.app_not_found_title()} body={m.app_not_found_body()} />
  );
}

/** The page for an address that a loader refused, which sets its own title as every page of the error boundary does. */
function MissingPage(): ReactNode {
  return (
    <>
      <PageTitle text={m.app_not_found_title()} />
      <MissingPageContent />
    </>
  );
}

/** The page for a failure that no route expected. */
function UnexpectedErrorPage(): ReactNode {
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

/** The page for a failure that a route threw: the page for an address that does not exist after a refusal, or the page for a failure that no route expected. */
export function RouteErrorPage({ error }: { error: unknown }): ReactNode {
  // A loader answers an address that a person may not see as one that does not exist, so a guessed address reveals nothing.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <MissingPage />;
  }
  return <UnexpectedErrorPage />;
}
