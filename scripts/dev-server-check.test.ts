import { expect, test } from "vitest";
import { readJsonFile } from "./json.ts";
import {
  isAppModule,
  modulesToEdit,
  pageProblems,
  parseDevArguments,
} from "./dev-server-check.ts";

test("reads the arguments of the dev script in package.json", () => {
  const devArguments = readJsonFile("package.json", parseDevArguments);
  expect(devArguments.ok && devArguments.value).toContain("server/main.ts");
});

test("rejects a dev script that does not start with node", () => {
  expect(
    parseDevArguments({ scripts: { dev: "vite dev" } }, "package.json"),
  ).toEqual({
    ok: false,
    failure:
      'package.json must start its dev script with "node", so the check can run it, but it starts with "vite".',
  });
});

test("rejects a package without a dev script", () => {
  expect(parseDevArguments({ scripts: {} }, "package.json")).toEqual({
    ok: false,
    failure:
      "package.json must have a string at scripts.dev, but scripts.dev is missing.",
  });
});

test("accepts pages that answer with success and names each page that does not, and when", () => {
  expect(
    pageProblems(
      [
        { path: "/health", outcome: { status: 200 } },
        { path: "/prices", outcome: { status: 500 } },
        { path: "/missing", outcome: { status: 404 } },
        { path: "/language", outcome: { connectionFailure: "socket hang up" } },
      ],
      "after an edit",
    ),
  ).toEqual([
    "/prices answered with status 500 after an edit.",
    "/missing answered with status 404 after an edit.",
    "/language did not answer after an edit. The connection reported: socket hang up",
  ]);
});

test("reads the modules of the app, and leaves out tests and the code that Paraglide generates", () => {
  for (const path of [
    "app/database/database.server.ts",
    "app/features/market-data/prices-view.tsx",
    "app/root.tsx",
  ]) {
    expect(isAppModule(path), path).toBe(true);
  }
  for (const path of [
    "app/features/market-data/prices-view.test.tsx",
    "app/formatting.test.ts",
    "app/paraglide/runtime.d.ts",
    "app/theme.css",
    "scripts/json.ts",
  ]) {
    expect(isAppModule(path), path).toBe(false);
  }
});

test("edits each module that creates a context and each schema, and no other module", () => {
  expect(
    modulesToEdit([
      {
        path: "app/database/database.server.ts",
        text: "export const databaseContext = createContext<Database>();",
      },
      {
        path: "app/features/market-data/price-source-context.server.ts",
        text: "export const priceSourceContext = createContext(defaultSource);",
      },
      {
        path: "app/features/market-data/market-data.schema.ts",
        text: 'export const stockQuotes = sqliteTable("stock_quotes", {});',
      },
      {
        path: "app/features/market-data/prices-page.tsx",
        text: "const database = context.get(databaseContext);",
      },
    ]),
  ).toEqual([
    "app/database/database.server.ts",
    "app/features/market-data/price-source-context.server.ts",
    "app/features/market-data/market-data.schema.ts",
  ]);
});
