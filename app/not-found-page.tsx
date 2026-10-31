import type { ReactNode } from "react";
import { data } from "react-router";
import { ErrorPage } from "./error-page";
import { m } from "./paraglide/messages.js";

// Every address that no other route matches comes here. The root middleware sets the language only for an address that matches a route, so this route lets the page appear in the reader's language.
export function loader(): ReturnType<typeof data<null>> {
  return data(null, { status: 404 });
}

export default function NotFoundPage(): ReactNode {
  return (
    <ErrorPage title={m.app_not_found_title()} body={m.app_not_found_body()} />
  );
}
