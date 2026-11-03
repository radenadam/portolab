import type { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  createLecturerWithClassForTest,
  joinContextForTest,
} from "./classes-for-test.server";
import { formatJoinCode } from "./join-code";
import { loader } from "./join-class-page";
import { joinLimits } from "./join-limiters.server";

/** Loads the address of a code with the headers that a browser sends, as the server does for a visitor who is not signed in. */
function loadAddressOfCode(
  context: RouterContextProvider,
  code: string,
  headers: Record<string, string>,
) {
  const url = new URL(`/join/${code}`, "http://localhost");
  return loader({
    context,
    request: new Request(url, { headers }),
    params: { code },
    url,
    pattern: "/join/:code",
  });
}

test("checks no code that another site makes a browser load, so such a site cannot use up the limit on wrong codes of a network", async () => {
  const database = openDatabaseForTest();
  const { joinCode } = await createLecturerWithClassForTest(database);
  const context = joinContextForTest(database);
  for (
    let attempt = 0;
    attempt < joinLimits.wrongCodes.failures;
    attempt += 1
  ) {
    expect(
      loadAddressOfCode(context, "aaaa-aaaa", {
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Dest": "image",
      }).data,
    ).toEqual({ kind: "codeForm", code: "aaaa-aaaa", failure: undefined });
  }
  // A student who opens the address from a chat on another site still finds the class.
  expect(
    loadAddressOfCode(context, formatJoinCode(joinCode), {
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-User": "?1",
    }).data,
  ).toMatchObject({
    kind: "class",
    classToJoin: { name: "Manajemen Portofolio A" },
  });
});
