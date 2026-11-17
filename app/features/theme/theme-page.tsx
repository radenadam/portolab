import type { ReactNode } from "react";
import { data, redirect } from "react-router";
import { FormPage } from "~/form-page";
import { parseOptionalText } from "~/form-text";
import { PageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import type { Route } from "./+types/theme-page";
import { parseThemeField } from "./parse-theme-field";
import { themeCookieHeader } from "./theme-cookie.server";
import { ThemeSwitch } from "./theme-switch";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const value = form.get("theme");
  const label = m.theme_switch_label();
  const theme = parseThemeField(value, label);
  if (!theme.ok) {
    const quotedValue = parseOptionalText(value, label);
    return data(
      {
        failure: theme.failure,
        quotedValue: quotedValue.ok ? quotedValue.value : undefined,
      },
      { status: 400 },
    );
  }
  return redirect(returnDestination(form.get("returnTo"), request), {
    headers: { "Set-Cookie": await themeCookieHeader(theme.value) },
  });
}

export default function ThemePage({
  actionData,
}: Route.ComponentProps): ReactNode {
  const title =
    actionData === undefined ? m.theme_page_title() : m.theme_rejected_title();
  return (
    <>
      <PageTitle text={title} />
      <FormPage title={title}>
        <ThemeSwitch
          failure={actionData?.failure}
          quotedValue={actionData?.quotedValue}
        />
      </FormPage>
    </>
  );
}
