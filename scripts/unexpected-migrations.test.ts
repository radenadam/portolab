import { expect, test } from "vitest";
import { unexpectedMigrations } from "./unexpected-migrations.ts";

test("accepts a schema whose migrations are all committed", () => {
  expect(
    unexpectedMigrations(
      ["0000_quotes.sql", "meta"],
      ["0000_quotes.sql", "meta"],
    ),
  ).toBeUndefined();
});

test("names one generated migration and asks to commit it", () => {
  expect(
    unexpectedMigrations(
      ["0000_quotes.sql"],
      ["0000_quotes.sql", "0001_orders.sql"],
    ),
  ).toBe(
    "The schema changed without a migration, so drizzle-kit generated 0001_orders.sql. Review it and commit it with the schema change.",
  );
});

test("names several generated migrations and asks to commit them", () => {
  expect(unexpectedMigrations([], ["0000_quotes.sql", "0001_orders.sql"])).toBe(
    "The schema changed without a migration, so drizzle-kit generated 0000_quotes.sql and 0001_orders.sql. Review them and commit them with the schema change.",
  );
});
