import type { ReactNode } from "react";
import { LanguageSwitch } from "~/features/language/language-switch";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/home-page";
import styles from "./home-page.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: m.app_name() }];
}

export default function HomePage(): ReactNode {
  return (
    <main className={styles["page"]}>
      <LanguageSwitch />
      <h1>{m.app_name()}</h1>
      <p>{m.home_tagline_body()}</p>
      <p className={styles["notice"]}>{m.app_simulation_notice()}</p>
    </main>
  );
}
