import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import { ErrorScreen } from "./error-page";
import { getLocale } from "./paraglide/runtime.js";
import { paraglideMiddleware } from "./paraglide/server.js";
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
  return <ErrorScreen error={error} />;
}
