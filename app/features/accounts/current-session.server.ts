import { createContext, data, redirect } from "react-router";
import type { MiddlewareFunction, RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { readyUser } from "./account";
import type { User } from "./account";
import { findAccountByUsername } from "./account-store.server";
import type { Role, UserId } from "./accounts.schema";
import { pathReturningTo } from "./path-returning-to";
import {
  expiredSessionCookieHeader,
  readSessionToken,
  sessionCookieHeader,
  setsSessionCookie,
} from "./session-cookie.server";
import { createSession, resumeSession } from "./session-store.server";
import type { CurrentSession } from "./session-store.server";

/** The session of the request, which the session middleware of the root route finds before any loader or action runs. */
export const currentSessionContext = createContext<CurrentSession | undefined>(
  undefined,
);

/** Finds the session that the cookie of a request names, and keeps the cookie as long as the session. */
export const sessionMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const token = await readSessionToken(request);
  const session = token?.ok
    ? resumeSession(context.get(databaseContext), token.value, new Date())
    : undefined;
  context.set(currentSessionContext, session);
  const response = await next();
  const signsInOrOut = setsSessionCookie(request, response);
  if (session !== undefined || signsInOrOut) {
    // A page for a signed-in person holds their data, so a shared computer must not keep a copy of it.
    response.headers.set("Cache-Control", "no-store");
  }
  if (signsInOrOut) {
    return response;
  }
  if (session?.wasExtended === true && token?.ok === true) {
    response.headers.append(
      "Set-Cookie",
      await sessionCookieHeader(request, token.value),
    );
  } else if (session === undefined && token !== undefined) {
    response.headers.append(
      "Set-Cookie",
      await expiredSessionCookieHeader(request),
    );
  }
  return response;
};

/** Starts a session of a person at a moment and returns the header that gives its cookie to the browser. Every sign-in starts a new session, so a token that someone planted before the sign-in never signs anyone in. */
export async function startSession(
  database: Database,
  request: Request,
  { userId, now }: { userId: UserId; now: Date },
): Promise<string> {
  return sessionCookieHeader(request, createSession(database, userId, now));
}

/** The person who is signed in and finished setting up the account. A visitor who is not signed in goes to the sign-in page, and a person who still has to finish the account goes to that step, and each returns to this page afterwards. The url is the one that React Router gives a loader or an action, because the url of the request ends in .data when the browser runs the app. */
export function requireUser(
  context: Readonly<RouterContextProvider>,
  url: URL,
): User {
  const session = requireSession(context, url);
  const user = readyUser(session.account);
  if (user === undefined) {
    throw redirect(pathReturningTo("/account/setup", currentPath(url)));
  }
  return user;
}

/** The person who is signed in with a role and finished setting up the account, such as the lecturer on a page for lecturers. A person with the other role gets the page for an address that does not exist, so they learn nothing about the pages of the role. */
export function requireRole(
  context: Readonly<RouterContextProvider>,
  url: URL,
  role: Role,
): User {
  const user = requireUser(context, url);
  if (user.role !== role) {
    throw data(null, { status: 404 });
  }
  return user;
}

/** The person who is signed in and finished setting up the account, or undefined for a visitor who is not signed in, for a page that serves both. A person who still has to finish the account goes to that step first. */
export function findUser(
  context: Readonly<RouterContextProvider>,
  url: URL,
): User | undefined {
  return context.get(currentSessionContext) === undefined
    ? undefined
    : requireUser(context, url);
}

/** The person who is signed in and finished setting up the account, or undefined for a visitor who is not signed in and for a person who still has to finish the account, for a part that every page shows, such as the frame, which sends no one elsewhere. */
export function readySignedInUser(
  context: Readonly<RouterContextProvider>,
): User | undefined {
  const session = context.get(currentSessionContext);
  return session === undefined ? undefined : readyUser(session.account);
}

/** The session of a person who is signed in, whether or not the account is ready, for the step that finishes it. A visitor who is not signed in goes to the sign-in page. */
export function requireSession(
  context: Readonly<RouterContextProvider>,
  url: URL,
): CurrentSession {
  const session = context.get(currentSessionContext);
  if (session === undefined) {
    throw redirect(pathReturningTo("/sign-in", currentPath(url)));
  }
  return session;
}

/** Reads the account of the session again after an action changed it, so that the loaders after the action serve the account as it is now. Before JavaScript loads, the browser sends a form in a request that runs the loaders of the page as well, after the session middleware read the account. A person whom the person who runs the server deleted meanwhile is signed out. */
export function reloadSessionAccount(
  context: Readonly<RouterContextProvider>,
  url: URL,
): void {
  const session = requireSession(context, url);
  const account = findAccountByUsername(
    context.get(databaseContext),
    session.account.username,
  );
  context.set(
    currentSessionContext,
    account === undefined ? undefined : { ...session, account },
  );
}

/** Whether the request comes from a person who is signed in, such as for the link to the classes on the home page. */
export function isSignedIn(context: Readonly<RouterContextProvider>): boolean {
  return context.get(currentSessionContext) !== undefined;
}

/** The role of the person who is signed in, whether or not the account is ready, or undefined for a visitor who is not signed in, which the navigation of the frame follows. */
export function signedInRole(
  context: Readonly<RouterContextProvider>,
): Role | undefined {
  return context.get(currentSessionContext)?.account.role;
}

function currentPath(url: URL): string {
  return `${url.pathname}${url.search}`;
}
