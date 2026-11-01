import { createContext, data, redirect } from "react-router";
import type { MiddlewareFunction, RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { readyUser } from "./account";
import type { User } from "./account";
import type { UserId } from "./accounts.schema";
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

/** Starts a session and returns the header that gives its cookie to the browser. Every sign-in starts a new session, so a token that someone planted before the sign-in never signs anyone in. */
export async function startSession(
  database: Database,
  request: Request,
  userId: UserId,
): Promise<string> {
  return sessionCookieHeader(
    request,
    createSession(database, userId, new Date()),
  );
}

/** The person who is signed in and finished setting up the account. A visitor who is not signed in goes to the sign-in page, and a person who still has to finish the account goes to that step, and each returns to this page afterwards. */
export function requireUser(
  context: Readonly<RouterContextProvider>,
  request: Request,
): User {
  const session = requireSession(context, request);
  const user = readyUser(session.account);
  if (user === undefined) {
    throw redirect(pathReturningTo("/account/setup", currentPath(request)));
  }
  return user;
}

/** The lecturer who is signed in and finished setting up the account. A student gets the page for an address that does not exist, so a student learns nothing about the pages of lecturers. */
export function requireLecturer(
  context: Readonly<RouterContextProvider>,
  request: Request,
): User {
  const user = requireUser(context, request);
  if (user.role !== "lecturer") {
    throw data(null, { status: 404 });
  }
  return user;
}

/** The person who is signed in and finished setting up the account, or undefined for a visitor who is not signed in, for a page that serves both. A person who still has to finish the account goes to that step first. */
export function findUser(
  context: Readonly<RouterContextProvider>,
  request: Request,
): User | undefined {
  return context.get(currentSessionContext) === undefined
    ? undefined
    : requireUser(context, request);
}

/** The session of a person who is signed in, whether or not the account is ready, for the step that finishes it. A visitor who is not signed in goes to the sign-in page. */
export function requireSession(
  context: Readonly<RouterContextProvider>,
  request: Request,
): CurrentSession {
  const session = context.get(currentSessionContext);
  if (session === undefined) {
    throw redirect(pathReturningTo("/sign-in", currentPath(request)));
  }
  return session;
}

/** Whether the request comes from a person who is signed in, such as for the link to the account in the header. */
export function isSignedIn(context: Readonly<RouterContextProvider>): boolean {
  return context.get(currentSessionContext) !== undefined;
}

/** A path of a step, such as the sign-in page, that returns to another path when it is done. */
export function pathReturningTo(path: string, returnPath: string): string {
  return `${path}?${new URLSearchParams({ returnTo: returnPath }).toString()}`;
}

function currentPath(request: Request): string {
  const { pathname, search } = new URL(request.url);
  return `${pathname}${search}`;
}
