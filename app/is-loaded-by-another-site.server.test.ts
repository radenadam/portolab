import { expect, test } from "vitest";
import { isLoadedByAnotherSite } from "./is-loaded-by-another-site.server";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/join/aaaa-aaaa", { headers });
}

const navigationFromAnotherSite = {
  "Sec-Fetch-Site": "cross-site",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Dest": "document",
};

const openedFromAnotherSite = {
  ...navigationFromAnotherSite,
  "Sec-Fetch-User": "?1",
};

test("finds a request that another site makes a browser send, such as for an image, a frame, a window that it steers, or a prefetch", () => {
  for (const headers of [
    {
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Dest": "image",
    },
    { ...openedFromAnotherSite, "Sec-Fetch-Dest": "iframe" },
    navigationFromAnotherSite,
    { ...openedFromAnotherSite, "Sec-Purpose": "prefetch" },
    {
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Dest": "script",
    },
  ]) {
    expect(
      isLoadedByAnotherSite(requestWith(headers)),
      JSON.stringify(headers),
    ).toBe(true);
  }
});

test("accepts a page that the reader opens from another site or from this one, and a request without the headers of a browser", () => {
  for (const headers of [
    openedFromAnotherSite,
    {
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    },
    {
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Dest": "document",
    },
    {},
  ]) {
    expect(
      isLoadedByAnotherSite(requestWith(headers)),
      JSON.stringify(headers),
    ).toBe(false);
  }
});
