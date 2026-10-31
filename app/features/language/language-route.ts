import { redirect } from "react-router";
import { writeLog } from "~/log.server";
import { cookieMaxAge, cookieName } from "~/paraglide/runtime.js";
import type { Route } from "./+types/language-route";
import { parseLocale } from "./parse-locale";
import { parseReturnPath } from "./parse-return-path";

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale"), "locale");
  if (!locale.ok) {
    return new Response(locale.failure, {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const returnPath = parseReturnPath(form.get("returnTo"), "returnTo");
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
