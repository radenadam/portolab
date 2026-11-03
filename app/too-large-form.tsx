import type { ReactNode } from "react";
import { isRouteErrorResponse, useLocation } from "react-router";
import { ErrorPage, NextStepLink } from "./error-page";
import { formMaximumBytes } from "./form-size";
import { formatBytes } from "./formatting";
import { PageTitle } from "./page-title";
import { m } from "./paraglide/messages.js";
import { isBytes } from "./units/bytes";

/** The status of the answer to a body larger than formMaximumBytes. Only the limit of the body answers with it, so the error page can tell its refusal from other failures. */
export const tooLargeFormStatus = 413;

/** Whether an error is the refusal of a body larger than formMaximumBytes. */
export function isTooLargeForm(error: unknown): boolean {
  return isRouteErrorResponse(error) && error.status === tooLargeFormStatus;
}

/** The page that explains why Portolab refused a form larger than its limit, with a link that opens the address of the form again. The refusal holds the size of the form when the request stated it. */
export function TooLargeFormPage({ refusal }: { refusal: unknown }): ReactNode {
  const { pathname, search } = useLocation();
  const maximum = formatBytes(formMaximumBytes);
  const size: unknown = isRouteErrorResponse(refusal)
    ? refusal.data
    : undefined;
  const body = isBytes(size)
    ? m.app_too_large_form_body({ size: formatBytes(size), maximum })
    : m.app_too_large_unstated_form_body({ maximum });
  return (
    <>
      <PageTitle text={m.app_too_large_form_title()} />
      <ErrorPage
        title={m.app_too_large_form_title()}
        body={body}
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
