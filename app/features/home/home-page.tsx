import type { ReactNode } from "react";
import { Link } from "react-router";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/home-page";
import styles from "./home-page.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: m.app_name() }];
}

export default function HomePage(): ReactNode {
  return (
    <>
      <h1>{m.app_name()}</h1>
      <p>{m.home_tagline_body()}</p>
      <Link to="/prices" className={styles["pricesLink"]}>
        {m.home_prices_link()}
      </Link>
    </>
  );
}
