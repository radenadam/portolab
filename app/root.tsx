import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { m } from "./paraglide/messages.js";
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
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(): ReactNode {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): ReactNode {
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className={styles["errorPage"]}>
      <h1>
        {isNotFound ? m.app_not_found_title() : m.app_unexpected_error_title()}
      </h1>
      <p>
        {isNotFound ? m.app_not_found_body() : m.app_unexpected_error_body()}
      </p>
      <a href="/">{m.app_back_home_link()}</a>
    </main>
  );
}
