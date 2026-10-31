import { redirect } from "react-router";
import { cookieMaxAge, cookieName, isLocale } from "~/paraglide/runtime.js";
import type { Route } from "./+types/language-route";
import { safeReturnPath } from "./safe-return-path";

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  const form = await request.formData();
  const locale = form.get("locale");
  if (typeof locale !== "string" || !isLocale(locale)) {
    return new Response(
      "The language must be one of the languages Portolab offers.",
      { status: 400 },
    );
  }
  return redirect(safeReturnPath(form.get("returnTo")), {
    headers: {
      "Set-Cookie": `${cookieName}=${locale}; Path=/; Max-Age=${String(cookieMaxAge)}; SameSite=Lax`,
    },
  });
}
