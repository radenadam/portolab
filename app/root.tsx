import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/dm-mono/400.css";
import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import { tabIconAddress } from "./app-icon";
import { databaseContext } from "./database/database.server";
import { RouteErrorPage } from "./error-page";
import { AccountLink } from "./features/accounts/account-link";
import type { Role } from "./features/accounts/accounts.schema";
import { crossSiteProtection } from "./features/accounts/cross-site-protection.server";
import {
  sessionMiddleware,
  signedInRole,
} from "./features/accounts/current-session.server";
import {
  isRefusedForm,
  RefusedFormPage,
} from "./features/accounts/refused-form";
import { LanguageSwitch } from "./features/language/language-switch";
import { latestQuoteTime } from "./features/market-data/latest-quote-time";
import { readPriceSourceDescription } from "./features/market-data/price-source-context.server";
import { listLatestQuotes } from "./features/market-data/quote-store.server";
import { frameNavigation } from "./features/navigation/frame-navigation";
import { formSizeLimit } from "./form-size-limit.server";
import { delayNoticeText, Frame } from "./frame";
import { getLocale } from "./paraglide/runtime.js";
import { paraglideMiddleware } from "./paraglide/server.js";
import "./theme.css";
import { isTooLargeForm, TooLargeFormPage } from "./too-large-form";

// The language comes first, so that a refused form and every later step speak the language of the reader. A form from another site is refused before its body is read. Paraglide copies the request that it gets but reads only its address and headers, so it gets a request without the body, of which its copy would otherwise keep everything that the server reads.
export const middleware: Route.MiddlewareFunction[] = [
  ({ request }, next) =>
    paraglideMiddleware(
      new Request(request.url, {
        method: request.method,
        headers: request.headers,
      }),
      () => next(),
    ),
  crossSiteProtection,
  formSizeLimit,
  sessionMiddleware,
];

export function links(): Route.LinkDescriptors {
  return [{ rel: "icon", type: "image/svg+xml", href: tabIconAddress }];
}

export function loader({ context }: Route.LoaderArgs): {
  role: Role | undefined;
  delayMinutes: number;
  latestQuotedAt: Date | undefined;
} {
  return {
    role: signedInRole(context),
    delayMinutes: readPriceSourceDescription(context).delayMinutes,
    latestQuotedAt: latestQuoteTime(
      listLatestQuotes(context.get(databaseContext)),
    ),
  };
}

// Every page and the error page share this frame, so the navigation, the mark of a simulation, and the delay of prices are on every screen, and no page draws its own main landmark.
export function Layout({ children }: { children: ReactNode }): ReactNode {
  // An error page has no data of the root when the error came before its loader, so the frame then leaves out the link to the account and the delay.
  const rootData = useRouteLoaderData<typeof loader>("root");
  const page = useMatches().at(-1);
  const role = rootData?.role;
  const navigation = frameNavigation(role, {
    routeId: page?.id,
    params: page?.params ?? {},
    search: new URLSearchParams(useLocation().search),
  });
  return (
    <html lang={getLocale()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Frame
          navigation={navigation.links}
          backLink={navigation.backLink}
          tools={
            <>
              {role !== undefined && <AccountLink />}
              <LanguageSwitch />
            </>
          }
          delayNotice={
            rootData === undefined
              ? undefined
              : delayNoticeText(rootData.delayMinutes, rootData.latestQuotedAt)
          }
          showsDelayOnPhone={navigation.showsDelayOnPhone}
        >
          {children}
        </Frame>
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
  if (isRefusedForm(error)) {
    return <RefusedFormPage />;
  }
  if (isTooLargeForm(error)) {
    return <TooLargeFormPage refusal={error} />;
  }
  return <RouteErrorPage error={error} />;
}
