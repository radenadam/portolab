import { createCookie } from "react-router";
import type { Cookie } from "react-router";
import type { Result } from "~/result";
import { sessionInactivityDays } from "./account-limits";
import { parseSessionToken } from "./session-store.server";
import type { SessionToken } from "./session-store.server";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: sessionInactivityDays * 24 * 60 * 60,
} as const;

// A browser accepts a cookie with the prefix __Host- only from a secure page, and only for this host, so no other site under a shared domain can plant a session. A demonstration on a laptop serves phones over plain HTTP, where a browser drops a Secure cookie, so a request over HTTP gets a cookie without the prefix and without Secure.
const secureCookie = createCookie("__Host-portolab_session", {
  ...cookieOptions,
  secure: true,
});
const plainCookie = createCookie("portolab_session", {
  ...cookieOptions,
  secure: false,
});

/** Reads the session token that a request carries, or returns undefined when it carries none. */
export async function readSessionToken(
  request: Request,
): Promise<Result<SessionToken, string> | undefined> {
  const cookie = cookieFor(request);
  const value: unknown = await cookie.parse(request.headers.get("Cookie"));
  return value === null
    ? undefined
    : parseSessionToken(value, `The cookie ${cookie.name}`);
}

/** The header that stores a session token in the browser for the lifetime of a session. */
export function sessionCookieHeader(
  request: Request,
  token: SessionToken,
): Promise<string> {
  return cookieFor(request).serialize(token);
}

/** The header that makes the browser forget its session token. */
export function expiredSessionCookieHeader(request: Request): Promise<string> {
  return cookieFor(request).serialize("", { maxAge: 0 });
}

/** Whether a response already sets the session cookie, because its route signed the person in or out. */
export function setsSessionCookie(
  request: Request,
  response: Response,
): boolean {
  const name = cookieFor(request).name;
  return response.headers
    .getSetCookie()
    .some((header) => header.startsWith(`${name}=`));
}

function cookieFor(request: Request): Cookie {
  return new URL(request.url).protocol === "https:"
    ? secureCookie
    : plainCookie;
}
