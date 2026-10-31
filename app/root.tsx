import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { UnexpectedErrorPage } from "./error-page";
import { getLocale } from "./paraglide/runtime.js";
import { paraglideMiddleware } from "./paraglide/server.js";
import styles from "./root.module.css";
import "./theme.css";

export const middleware: Route.MiddlewareFunction[] = [
  ({ request }, next) => paraglideMiddleware(request, () => next()),
];

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
        {/* Every page and the error page share this landmark, so no page draws its own. */}
        <main className={styles["main"]}>{children}</main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): ReactNode {
  return <Outlet />;
}

export function ErrorBoundary(): ReactNode {
  return <UnexpectedErrorPage />;
}
