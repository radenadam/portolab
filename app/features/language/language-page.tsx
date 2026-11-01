import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { ErrorPage } from "~/error-page";
import { PageTitle } from "~/page-title";
import { returnDestination } from "~/return-destination.server";
import { m } from "~/paraglide/messages.js";
import { cookieMaxAge, cookieName } from "~/paraglide/runtime.js";
import type { Route } from "./+types/language-page";
import { parseLocale } from "./parse-locale";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale"), m.language_switch_label());
  if (!locale.ok) {
    return data({ failure: locale.failure }, { status: 400 });
  }
  // The language still changes when the path could lead to another site, and the reader goes to the home page instead.
  return redirect(returnDestination(form.get("returnTo"), request), {
    headers: {
      "Set-Cookie": `${cookieName}=${locale.value}; Path=/; Max-Age=${String(cookieMaxAge)}; SameSite=Lax`,
    },
  });
}

/** The page of the language switch, which the header of every page holds. A plain visit points to the switch, and a rejected language shows why. */
export default function LanguagePage({
  actionData,
}: Route.ComponentProps): ReactNode {
  if (actionData === undefined) {
    return (
      <>
        <PageTitle text={m.language_page_title()} />
        <h1>{m.language_page_title()}</h1>
        <p>{m.language_page_body()}</p>
      </>
    );
  }
  return (
    <>
      <PageTitle text={m.language_rejected_title()} />
      <ErrorPage
        title={m.language_rejected_title()}
        body={actionData.failure}
      />
    </>
  );
}
