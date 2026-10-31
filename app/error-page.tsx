import type { ReactNode } from "react";
import styles from "./error-page.module.css";
import { m } from "./paraglide/messages.js";

interface ErrorPageProps {
  title: string;
  body: string;
}

/** A page that explains why the reader cannot see what they asked for, with a way back to the home page. */
export function ErrorPage({ title, body }: ErrorPageProps): ReactNode {
  return (
    <main className={styles["page"]}>
      {/* An error page has no route meta, so it names itself. React places this title in the head. */}
      <title>{`${title} | ${m.app_name()}`}</title>
      <h1>{title}</h1>
      <p>{body}</p>
      <a href="/" className={styles["backHome"]}>
        {m.app_back_home_link()}
      </a>
    </main>
  );
}
