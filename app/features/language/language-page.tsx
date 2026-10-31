import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { ErrorPage, PageTitle } from "~/error-page";
import { writeLog } from "~/log.server";
import { m } from "~/paraglide/messages.js";
import { cookieMaxAge, cookieName } from "~/paraglide/runtime.js";
import type { Route } from "./+types/language-page";
import { LanguageSwitch } from "./language-switch";
import { parseLocale } from "./parse-locale";
import { parseReturnPath } from "./parse-return-path";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale"), "locale");
  if (!locale.ok) {
    return data({ failure: locale.failure }, { status: 400 });
  }
  const returnPath = parseReturnPath(
    form.get("returnTo"),
    "returnTo",
    new URL(request.url).origin,
  );
  // The language still changes, and the reader goes to the home page instead of a path that could lead to another site.
  if (!returnPath.ok) {
    writeLog("warning", returnPath.failure);
  }
  return redirect(returnPath.ok ? returnPath.value : "/", {
    headers: {
      "Set-Cookie": `${cookieName}=${locale.value}; Path=/; Max-Age=${String(cookieMaxAge)}; SameSite=Lax`,
    },
  });
}

/** The page of the language switch. A plain visit shows the switch, and a rejected language shows why, beside the switch that its text points to. */
export default function LanguagePage({
  actionData,
}: Route.ComponentProps): ReactNode {
  if (actionData === undefined) {
    return (
      <>
        <PageTitle text={m.language_page_title()} />
        <h1>{m.language_page_title()}</h1>
        <LanguageSwitch />
      </>
    );
  }
  return (
    <>
      <ErrorPage
        title={m.language_rejected_title()}
        body={actionData.failure}
      />
      <LanguageSwitch />
    </>
  );
}
