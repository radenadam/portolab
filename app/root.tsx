import type { ReactNode } from "react";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { UnexpectedErrorPage } from "./error-page";
import { LanguageSwitch } from "./features/language/language-switch";
import { m } from "./paraglide/messages.js";
import { getLocale } from "./paraglide/runtime.js";
import { paraglideMiddleware } from "./paraglide/server.js";
import styles from "./root.module.css";
import "./theme.css";

export const middleware: Route.MiddlewareFunction[] = [
  ({ request }, next) => paraglideMiddleware(request, () => next()),
];

// Every page and the error page share this frame, so the language switch and the simulation notice are on every screen, and no page draws its own main landmark.
export function Layout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang={getLocale()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className={styles["header"]}>
          <Link to="/" className={styles["brand"]}>
            {m.app_name()}
          </Link>
          <LanguageSwitch />
        </header>
        <main className={styles["main"]}>{children}</main>
        <footer className={styles["footer"]}>
          <p>{m.app_simulation_notice()}</p>
        </footer>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root(): ReactNode {
  return <Outlet />;
}

export function ErrorBoundary(): ReactNode {
  return <UnexpectedErrorPage />;
}
