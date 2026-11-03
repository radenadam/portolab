/** Whether another site, or another origin of the same site, made the browser send this request without the reader opening the page, such as through an image, a frame, a window that the other site steers, or a prefetch. A browser names who started a request in the header Sec-Fetch-Site, marks a navigation that the reader started with Sec-Fetch-User, and marks a prefetch with Sec-Purpose. A request without these headers, which no browser sends, counts as opened by the reader. */
export function isLoadedByAnotherSite(request: Request): boolean {
  const site = request.headers.get("Sec-Fetch-Site");
  const isOpenedByReader =
    request.headers.get("Sec-Fetch-Mode") === "navigate" &&
    request.headers.get("Sec-Fetch-Dest") === "document" &&
    request.headers.get("Sec-Fetch-User") === "?1" &&
    !request.headers.has("Sec-Purpose");
  return (site === "cross-site" || site === "same-site") && !isOpenedByReader;
}
