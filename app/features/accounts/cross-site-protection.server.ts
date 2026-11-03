import { data } from "react-router";
import type { MiddlewareFunction } from "react-router";
import { writeLog } from "~/write-log.server";
import { refusedFormStatus } from "./refused-form";

const safeMethods = new Set(["GET", "HEAD"]);

/** Refuses a form that another site sent, and forbids other sites to show Portolab in a frame. A browser names the site of every form in the Origin header, so a form whose origin is not this site came from a page that Portolab cannot trust. */
export const crossSiteProtection: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  const origin = request.headers.get("Origin");
  if (
    !safeMethods.has(request.method) &&
    origin !== new URL(request.url).origin
  ) {
    writeLog("warning", "Refused a form from another site.", {
      url: request.url,
      origin,
    });
    throw data(null, { status: refusedFormStatus });
  }
  const response = await next();
  // A page in a frame of another site can hide a button of Portolab under something that the reader means to click.
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
};

/** Whether another site made the browser load this address without the reader opening it, such as through an image or a frame. A browser names the site that started a request in the Sec-Fetch-Site header, and how the answer is used in Sec-Fetch-Mode and Sec-Fetch-Dest. A request without these headers, such as one from a script, counts as opened. */
export function isLoadedByAnotherSite(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  const isOpenedPage =
    request.headers.get("Sec-Fetch-Mode") === "navigate" &&
    request.headers.get("Sec-Fetch-Dest") === "document";
  return (site === "cross-site" || site === "same-site") && !isOpenedPage;
}
