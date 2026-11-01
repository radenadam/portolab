import type { ReactNode } from "react";
import { redirect } from "react-router";
import { databaseContext } from "~/database/database.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/sign-out-page";
import { currentSessionContext } from "./current-session.server";
import { expiredSessionCookieHeader } from "./session-cookie.server";
import { deleteSession } from "./session-store.server";
import { SignOutButton } from "./sign-out-button";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.accounts_sign_out_title()) }];
}

export async function action({ context, request }: Route.ActionArgs) {
  const session = context.get(currentSessionContext);
  if (session !== undefined) {
    deleteSession(context.get(databaseContext), session.id);
  }
  return redirect("/", {
    headers: { "Set-Cookie": await expiredSessionCookieHeader(request) },
  });
}

/** The page of the button that signs out, which the page of the account holds. A plain visit shows the button alone. */
export default function SignOutPage(): ReactNode {
  return (
    <>
      <h1>{m.accounts_sign_out_title()}</h1>
      <p>{m.accounts_sign_out_body()}</p>
      <SignOutButton />
    </>
  );
}
