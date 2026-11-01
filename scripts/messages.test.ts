import { expect, test } from "vitest";
import {
  isInterfaceTest,
  messageKeyProblems,
  messageKeys,
  parseLocales,
  readMessages,
  untestedMessageProblems,
} from "./messages.ts";

test("accepts keys that start with a feature folder or with app and end with a kind of text", () => {
  const keys = ["app_name", "market_data_title", "market_data_code_label"];
  expect(
    messageKeyProblems(
      new Map([
        ["id", keys],
        ["en", keys],
      ]),
      ["market-data"],
    ),
  ).toEqual([]);
});

test("rejects a key that one language lacks", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["app_name", "app_back_home_link"]],
        ["en", ["app_name"]],
      ]),
      [],
    ),
  ).toEqual(['messages/en.json: add the message "app_back_home_link".']);
});

test("rejects a key that starts with no feature folder", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["prices_title"]],
        ["en", ["prices_title"]],
      ]),
      ["market-data"],
    ),
  ).toEqual([
    '"prices_title": start the key with the feature folder that uses it, or with "app_" when the whole app shares it.',
  ]);
});

test("rejects a key that ends with no kind of text", () => {
  expect(
    messageKeyProblems(
      new Map([
        ["id", ["app_tagline"]],
        ["en", ["app_tagline"]],
      ]),
      [],
    ),
  ).toEqual([
    '"app_tagline": end the key with the kind of text it holds, which is one of _title, _body, _label, _notice, _error, _link, _name, or _phrase.',
  ]);
});

test("lists the message keys without the schema key", () => {
  expect(
    messageKeys({
      $schema: "https://inlang.com/schema/inlang-message-format",
      app_name: "Portolab",
    }),
  ).toEqual(["app_name"]);
});

test("reads a language file of messages", () => {
  const messages = readMessages("messages/en.json");
  expect(messages.ok && messages.value["app_name"]).toBe("Portolab");
});

test("reports a messages file that cannot be read", () => {
  const messages = readMessages("messages/missing.json");
  expect(messages.ok ? "" : messages.failure).toMatch(
    /^messages\/missing\.json cannot be read\. The system reported: /,
  );
});

test("reads the locales from the inlang settings and rejects settings without them", () => {
  expect(parseLocales({ locales: ["id", "en"] }, "settings.json")).toEqual({
    ok: true,
    value: ["id", "en"],
  });
  expect(parseLocales({}, "settings.json")).toEqual({
    ok: false,
    failure:
      "settings.json must have a list of strings that is not empty at locales, but locales is missing.",
  });
});

test("chooses the browser tests and the tests of the app, and no other file", () => {
  for (const path of [
    "e2e/prices.test.ts",
    "app/features/market-data/prices-view.test.tsx",
    "app/formatting.test.ts",
  ]) {
    expect(isInterfaceTest(path), path).toBe(true);
  }
  for (const path of [
    "e2e/languages.ts",
    "app/features/market-data/prices-view.tsx",
    "scripts/messages.test.ts",
    ".github/review/prices.test.ts",
  ]) {
    expect(isInterfaceTest(path), path).toBe(false);
  }
});

test("accepts a message that a test shows as a whole string with any quote, and a message whose parts between placeholders appear in a test", () => {
  for (const test of [
    'getByText("Kode")',
    "getByText('Kode')",
    "getByText(`Kode`)",
  ]) {
    expect(
      untestedMessageProblems(
        "messages/id.json",
        {
          market_data_code_label: "Kode",
          market_data_next_attempt_notice:
            "Portolab mencoba lagi pada {nextTime} WIB.",
        },
        [
          test,
          'const next = "Portolab mencoba lagi pada 2 Nov 2026, 08.45 WIB.";',
        ],
      ),
      test,
    ).toEqual([]);
  }
});

test("rejects a message without placeholders that a test shows only inside a longer string", () => {
  expect(
    untestedMessageProblems(
      "messages/id.json",
      { language_switch_label: "Bahasa" },
      ['getByRole("button", { name: "Bahasa Indonesia" })'],
    ),
  ).toEqual([
    'messages/id.json: no test checks the message "language_switch_label", so add a test that shows "Bahasa" as a whole string.',
  ]);
});

test("names each part of a message that no test shows, for one part and for several", () => {
  const messages = {
    market_data_delay_notice: "Prices at {time} WIB from {source}.",
  };
  expect(
    untestedMessageProblems("messages/en.json", messages, ['" WIB from "']),
  ).toEqual([
    'messages/en.json: no test checks the message "market_data_delay_notice" in full, so add a test that shows "Prices at ".',
  ]);
  expect(untestedMessageProblems("messages/en.json", messages, [])).toEqual([
    'messages/en.json: no test checks the message "market_data_delay_notice" in full, so add a test that shows "Prices at " and " WIB from ".',
  ]);
});

test("rejects a message that is not text", () => {
  expect(
    untestedMessageProblems(
      "messages/en.json",
      { market_data_code_label: { match: {} } },
      [],
    ),
  ).toEqual([
    'messages/en.json: the message "market_data_code_label" must be text, but it is {"match":{}}.',
  ]);
});
