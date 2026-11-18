import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { parsePriceGuide } from "./parse-price-guide";
import { readPriceGuide } from "./read-price-guide.server";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { Locale } from "~/paraglide/runtime.js";

const files = import.meta.glob<string>("./price-guide/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});
const titles: Record<Locale, string> = {
  id: "Cara membaca harga saham",
  en: "How to read a stock price",
};

for (const locale of locales) {
  test(`loads and validates the price guide in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = readPriceGuide();
    expect(content.title).toBe(titles[locale]);
    expect(Object.keys(content.sections)).toEqual([
      "key-idea",
      "code",
      "price",
      "change",
      "time",
    ]);
    expect(parsePriceGuide(files, "Price guide").ok).toBe(true);
    const path = `./price-guide/${locale}.md`;
    const missing = Object.fromEntries(
      Object.entries(files).filter(([name]) => name !== path),
    );
    expect(parsePriceGuide(missing, "Missing translation").ok).toBe(false);
    for (const markdown of [
      null,
      "# Empty\n",
      files[path]?.replace("## time", "## unknown"),
      files[path]?.replace("## time", "## code"),
      files[path]?.replace("## time", "## time\n\n{{formula:beta}}"),
    ])
      expect(
        parsePriceGuide({ ...files, [path]: markdown }, "Malformed guide").ok,
      ).toBe(false);
  });
}

test("refuses unexpected guide paths and values with their source", () => {
  for (const value of [
    null,
    [],
    "markdown",
    { ...files, "./price-guide/xx.md": "# Unknown" },
  ]) {
    const parsed = parsePriceGuide(value, "Guide inputs");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.failure).toContain("Guide inputs");
  }
});

test("reports malformed content in every independent translation", () => {
  const parsed = parsePriceGuide(
    Object.fromEntries(
      Object.keys(files).map((path) => [path, "not Markdown"]),
    ),
    "Guide translations",
  );
  expect(parsed.ok).toBe(false);
  if (parsed.ok) throw new Error("The malformed translations passed parsing.");
  for (const path of Object.keys(files)) expect(parsed.failure).toContain(path);
});
