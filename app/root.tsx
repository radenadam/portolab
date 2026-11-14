import "@fontsource-variable/instrument-sans/wght.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/dm-mono/500.css";
import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import { tabIconAddress } from "./app-icon";
import { RouteErrorPage } from "./error-page";
import { sessionMiddleware } from "./features/accounts/current-session.server";
import { crossSiteProtection } from "./features/accounts/cross-site-protection.server";
import { ProfileMenu } from "./features/accounts/profile-menu";
import {
  isRefusedForm,
  RefusedFormPage,
} from "./features/accounts/refused-form";
import { lastClassMiddleware } from "./features/classes/last-class.server";
import { LanguageMenu } from "./features/language/language-menu";
import { SimulationBadge } from "./features/market-data/simulation-badge";
import { readSimulationBadge } from "./features/market-data/read-simulation-badge.server";
import type { SimulationBadgeData } from "./features/market-data/read-simulation-badge.server";
import { ClassSwitcher } from "./features/navigation/class-switcher";
import { frameItems } from "./features/navigation/frame-navigation";
import type { FrameReader } from "./features/navigation/frame-reader";
import { readFrameReader } from "./features/navigation/frame-reader.server";
import { formSizeLimit } from "./form-size-limit.server";
import { Frame } from "./frame";
import type { FrameProfile } from "./frame";
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
  lastClassMiddleware,
];

export function links(): Route.LinkDescriptors {
  return [{ rel: "icon", type: "image/svg+xml", href: tabIconAddress }];
}

export async function loader({
  context,
  request,
  params,
}: Route.LoaderArgs): Promise<{
  reader: FrameReader;
  simulation: SimulationBadgeData;
}> {
  return {
    reader: await readFrameReader(context, request, params),
    simulation: readSimulationBadge(context, new Date()),
  };
}

// Every page and the error page share this frame, so the navigation and the badge of the simulation are on every screen, and no page draws its own main landmark.
export function Layout({ children }: { children: ReactNode }): ReactNode {
  // An error page has no data of the root when the error came before its loader, so the frame then leaves out the navigation, the profile, and the card of the badge.
  const rootData = useRouteLoaderData<typeof loader>("root");
  const page = useMatches().at(-1);
  const reader = rootData?.reader;
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
          items={frameItems(reader, {
            routeId: page?.id,
            params: page?.params ?? {},
          })}
          {...readerParts(reader)}
          badge={<SimulationBadge badge={rootData?.simulation} />}
        >
          {children}
        </Frame>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** The parts of the frame that depend on who reads the page: the switcher of the class of the workspace, the profile of a person who is signed in, and the language of everyone else, who has no menu of a profile to hold it. */
function readerParts(reader: FrameReader | undefined): {
  start: ReactNode;
  profile: FrameProfile | undefined;
  tools: ReactNode;
} {
  if (reader?.kind !== "user") {
    return { start: undefined, profile: undefined, tools: <LanguageMenu /> };
  }
  return {
    start:
      reader.workspace === undefined ? undefined : (
        <ClassSwitcher readerRole={reader.role} workspace={reader.workspace} />
      ),
    profile: {
      name: reader.name,
      menu: <ProfileMenu name={reader.name} readerRole={reader.role} />,
    },
    tools: undefined,
  };
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
