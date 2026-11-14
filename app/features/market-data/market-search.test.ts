import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { parseReturnPath } from "~/parse-return-path";
import { defaultMarketFilters } from "./market-filters";
import { marketSearch } from "./market-search";

test("omits equivalent search padding so a matching stock keeps a bounded return address", () => {
  const code = "BBCA";
  const query = `${" ".repeat(fieldMaximumLength - code.length)}${code}`;
  expect(query).toHaveLength(fieldMaximumLength);
  const search = marketSearch({ ...defaultMarketFilters, query });
  expect(new URLSearchParams(search).get("q")).toBe("BBCA");
  const address = `/classes/7/market${search}#stock-BBCA`;
  expect(
    parseReturnPath(
      address,
      "The market return address",
      "https://portolab.test",
    ),
  ).toEqual({
    ok: true,
    value: address,
  });
});
