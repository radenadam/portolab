import { createCookie } from "react-router";
import type { Cookie } from "react-router";
import type { Result } from "~/result";
import { dayMilliseconds, secondMilliseconds } from "~/time-units";
import { sessionInactivityDays } from "./account-limits";
import { parseSessionToken } from "./session-store.server";
import type { SessionToken } from "./session-store.server";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // A cookie counts its lifetime in seconds.
  maxAge: (sessionInactivityDays * dayMilliseconds) / secondMilliseconds,
} as const;

// Decision 0005 explains why a request over HTTPS gets a cookie that is Secure, with the prefix __Host-, and a request over plain HTTP gets one without either.
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
