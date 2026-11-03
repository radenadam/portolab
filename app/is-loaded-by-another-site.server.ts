/** Whether another site made the browser load this address without the reader opening it, such as through an image or a frame. A browser names the site that started a request in the Sec-Fetch-Site header, and how the answer is used in Sec-Fetch-Mode and Sec-Fetch-Dest. A request without these headers, such as one from a script, counts as opened. */
export function isLoadedByAnotherSite(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  const isOpenedPage =
    request.headers.get("Sec-Fetch-Mode") === "navigate" &&
    request.headers.get("Sec-Fetch-Dest") === "document";
  return (site === "cross-site" || site === "same-site") && !isOpenedPage;
}
