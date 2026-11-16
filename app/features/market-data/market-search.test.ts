import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { parseReturnPath } from "~/parse-return-path";
import { defaultMarketFilters } from "./market-filters";
import { marketSearch } from "./market-search";

test.each([undefined, 9, 10] as const)(
  "omits equivalent search padding so task %s keeps a bounded stock return address",
  (task) => {
    const code = "BBCA";
    const query = `${" ".repeat(fieldMaximumLength - code.length)}${code}`;
    expect(query).toHaveLength(fieldMaximumLength);
    const search = marketSearch({ ...defaultMarketFilters, query }, task);
    expect(new URLSearchParams(search).get("q")).toBe("BBCA");
    expect(new URLSearchParams(search).get("lessonTask")).toBe(
      task === undefined ? null : String(task),
    );
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
  },
);
