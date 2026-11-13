import type { ReactNode } from "react";
import { Link, redirect } from "react-router";
import { isSignedIn } from "~/features/accounts/current-session.server";
import { landingPath } from "~/features/navigation/frame-reader.server";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/home-page";
import styles from "./home-page.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: m.app_name() }];
}

// A person who is signed in lands in the workspace of a class, as decision 0030 sets, so the app icon and every other way home lead there.
export async function loader({
  context,
  request,
  url,
}: Route.LoaderArgs): Promise<null> {
  if (isSignedIn(context)) {
    throw redirect(await landingPath(context, request, url));
  }
  return null;
}

export default function HomePage(): ReactNode {
  return (
    <>
      <h1>{m.app_name()}</h1>
      <p>{m.home_tagline_body()}</p>
      <Link to="/join" className={styles["link"]}>
        {m.home_join_link()}
      </Link>
      <Link to="/prices" className={styles["link"]}>
        {m.home_prices_link()}
      </Link>
    </>
  );
}
