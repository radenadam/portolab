import { redirect } from "react-router";
import { isSignedIn } from "~/features/accounts/current-session.server";
import { landingPath } from "~/features/navigation/frame-reader.server";
import type { Route } from "./+types/home-page";

export async function loader({
  context,
  request,
  url,
}: Route.LoaderArgs): Promise<never> {
  throw redirect(
    isSignedIn(context) ? await landingPath(context, request, url) : "/sign-in",
  );
}
