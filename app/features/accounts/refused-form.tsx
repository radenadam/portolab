import type { ReactNode } from "react";
import { isRouteErrorResponse } from "react-router";
import { ErrorPage } from "~/error-page";
import { PageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";

/** The status of the answer to a form from another site. Only the protection against such forms answers with it, so the error page can tell its refusal from other failures. */
export const refusedFormStatus = 403;

/** Whether an error is the refusal of a form from another site. */
export function isRefusedForm(error: unknown): boolean {
  return isRouteErrorResponse(error) && error.status === refusedFormStatus;
}

/** The page that explains why Portolab refused a form from another site. */
export function RefusedFormPage(): ReactNode {
  return (
    <>
      <PageTitle text={m.accounts_refused_form_title()} />
      <ErrorPage
        title={m.accounts_refused_form_title()}
        body={m.accounts_refused_form_body()}
      />
    </>
  );
}
