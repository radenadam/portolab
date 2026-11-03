import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import styles from "./error-page.module.css";
import { formMaximumBytes } from "./form-size";
import { formatKilobytes } from "./formatting";
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
function NextStepLink({ to, label }: { to: string; label: string }): ReactNode {
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
export function MissingPage(): ReactNode {
  return (
    <>
      <PageTitle text={m.app_not_found_title()} />
      <MissingPageContent />
    </>
  );
}

/** The page for a failure that no route expected. */
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

/** The page for a form larger than the limit of a request body, with a link that opens the address of the form again. */
export function TooLargeFormPage(): ReactNode {
  const { pathname, search } = useLocation();
  return (
    <>
      <PageTitle text={m.app_too_large_form_title()} />
      <ErrorPage
        title={m.app_too_large_form_title()}
        body={m.app_too_large_form_body({
          maximum: formatKilobytes(formMaximumBytes),
        })}
        nextStep={
          <NextStepLink
            to={`${pathname}${search}`}
            label={m.app_open_form_again_link()}
          />
        }
      />
    </>
  );
}
