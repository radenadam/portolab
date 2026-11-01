import type { ReactNode } from "react";
import { Link } from "react-router";
import { isSignedIn } from "~/features/accounts/current-session.server";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/home-page";
import styles from "./home-page.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: m.app_name() }];
}

export function loader({ context }: Route.LoaderArgs): {
  isSignedIn: boolean;
} {
  return { isSignedIn: isSignedIn(context) };
}

export default function HomePage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return (
    <>
      <h1>{m.app_name()}</h1>
      <p>{m.home_tagline_body()}</p>
      {loaderData.isSignedIn ? (
        <Link to="/classes" className={styles["link"]}>
          {m.home_classes_link()}
        </Link>
      ) : (
        <Link to="/join" className={styles["link"]}>
          {m.home_join_link()}
        </Link>
      )}
      <Link to="/prices" className={styles["link"]}>
        {m.home_prices_link()}
      </Link>
    </>
  );
}
