import type { RouterContextProvider } from "react-router";
import { lastClassMiddleware } from "./last-class.server";

/** The headers with which a browser asks for a page that its reader opened. */
const openedByReader = {
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-User": "?1",
};

/** Opens a page of an address through the middleware that remembers the class of a page, with the cookie and the headers that a browser sends, and returns the header Set-Cookie of the answer, or undefined when the answer sets no cookie. */
export async function openPageForTest(
  context: RouterContextProvider,
  {
    path,
    params,
    cookie = "",
    headers = openedByReader,
  }: {
    path: string;
    params: Record<string, string>;
    cookie?: string;
    headers?: Record<string, string>;
  },
): Promise<string | undefined> {
  const url = new URL(path, "http://localhost");
  const request = new Request(url, { headers: { ...headers, Cookie: cookie } });
  const response = await lastClassMiddleware(
    { request, url, params, pattern: path, context },
    () => Promise.resolve(new Response("the page")),
  );
  if (!(response instanceof Response)) {
    throw new Error("The middleware answered without a response.");
  }
  const [setCookie] = response.headers.getSetCookie();
  return setCookie;
}

/** The value of the header Cookie with which a browser sends back the cookie that a header Set-Cookie gave it. */
export function cookieOfForTest(setCookie: string | undefined): string {
  return setCookie?.split(";")[0] ?? "";
}
