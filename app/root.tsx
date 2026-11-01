import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource-variable/ibm-plex-sans/wght.css";
import type { ReactNode } from "react";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import { UnexpectedErrorPage } from "./error-page";
import { AccountLink } from "./features/accounts/account-link";
import { crossSiteProtection } from "./features/accounts/cross-site-protection.server";
import {
  isSignedIn,
  sessionMiddleware,
} from "./features/accounts/current-session.server";
import {
  isRefusedForm,
  RefusedFormPage,
} from "./features/accounts/refused-form";
import { LanguageSwitch } from "./features/language/language-switch";
import { m } from "./paraglide/messages.js";
import { getLocale } from "./paraglide/runtime.js";
import { paraglideMiddleware } from "./paraglide/server.js";
import styles from "./root.module.css";
import "./theme.css";

// The language comes first, so that a refused form and every later step speak the language of the reader.
export const middleware: Route.MiddlewareFunction[] = [
  ({ request }, next) => paraglideMiddleware(request, () => next()),
  crossSiteProtection,
  sessionMiddleware,
];

export function loader({ context }: Route.LoaderArgs): {
  isSignedIn: boolean;
} {
  return { isSignedIn: isSignedIn(context) };
}

// Every page and the error page share this frame, so the language switch and the simulation notice are on every screen, and no page draws its own main landmark.
export function Layout({ children }: { children: ReactNode }): ReactNode {
  // An error page has no data of the root when the error came before its loader, so the header then leaves out the link to the account.
  const rootData = useRouteLoaderData<typeof loader>("root");
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
          {rootData !== undefined && (
            <AccountLink isSignedIn={rootData.isSignedIn} />
          )}
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

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  return isRefusedForm(error) ? <RefusedFormPage /> : <UnexpectedErrorPage />;
}
