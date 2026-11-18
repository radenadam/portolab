import { getLocale, locales } from "~/paraglide/runtime.js";
import { parsePriceGuide } from "./parse-price-guide";

const files = import.meta.glob<string>("./price-guide/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

export function readPriceGuide() {
  const parsed = parsePriceGuide(files, "Price guide");
  if (!parsed.ok) throw new Error(parsed.failure);
  const content = parsed.value[locales.indexOf(getLocale())];
  if (content === undefined)
    throw new Error("The parsed price guides lack the active language.");
  return content;
}
