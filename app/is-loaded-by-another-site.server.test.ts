import { expect, test } from "vitest";
import { isLoadedByAnotherSite } from "./is-loaded-by-another-site.server";

function requestWith(headers: Record<string, string>): Request {
  return new Request("http://localhost/join/aaaa-aaaa", { headers });
}

test("finds an address that another site makes a browser load, such as through an image or a frame", () => {
  for (const [site, mode, destination] of [
    ["cross-site", "no-cors", "image"],
    ["cross-site", "navigate", "iframe"],
    ["same-site", "no-cors", "script"],
  ] as const) {
    expect(
      isLoadedByAnotherSite(
        requestWith({
          "Sec-Fetch-Site": site,
          "Sec-Fetch-Mode": mode,
          "Sec-Fetch-Dest": destination,
        }),
      ),
      `${site} ${mode} ${destination}`,
    ).toBe(true);
  }
});

test("accepts an address that the reader opens, from this site, from another site, or without the headers of a browser", () => {
  for (const headers of [
    {
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Dest": "document",
    },
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
