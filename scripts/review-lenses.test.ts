import { expect, test } from "vitest";
import { chooseLenses, parseChangedFiles } from "./review-lenses.ts";
import type { ChangedFile, Lens } from "./review-lenses.ts";

function modified(path: string): ChangedFile {
  return { path, change: "modified" };
}

test("reads the files, their changes, and a path with spaces from git diff", () => {
  expect(
    parseChangedFiles(
      "M\0app/root.tsx\0A\0docs/a b.md\0D\0old.ts\0T\0link\0",
      "git diff",
    ),
  ).toEqual({
    ok: true,
    value: [
      { path: "app/root.tsx", change: "modified" },
      { path: "docs/a b.md", change: "added" },
      { path: "old.ts", change: "deleted" },
      { path: "link", change: "modified" },
    ],
  });
  expect(parseChangedFiles("", "git diff")).toEqual({ ok: true, value: [] });
});

test("rejects a status that a diff without renames does not print, and text that does not end in NUL", () => {
  expect(parseChangedFiles("R100\0a.ts\0", "git diff")).toEqual({
    ok: false,
    failure:
      'git diff must give each file the status A, M, T, or D, but a.ts has "R100".',
  });
  expect(parseChangedFiles("M\0a.ts", "git diff")).toEqual({
    ok: false,
    failure:
      'git diff must hold a status and a path for each file, each ended by a NUL character, but it is "M\\u0000a.ts".',
  });
});

test("chooses no lens for no file", () => {
  expect(chooseLenses([])).toEqual([]);
});

const expectedLenses: [ChangedFile, Lens[]][] = [
  [modified("docs/product.md"), ["consistency", "docs", "standards"]],
  [
    modified("messages/id.json"),
    ["consistency", "docs", "product", "standards"],
  ],
  [
    modified("app/features/trading/order.ts"),
    ["consistency", "craft", "docs", "reliability", "standards"],
  ],
  [
    modified("app/features/trading/order-page.tsx"),
    ["consistency", "craft", "docs", "product", "reliability", "standards"],
  ],
  [
    modified("app/theme.css"),
    ["consistency", "craft", "docs", "product", "standards"],
  ],
  [
    modified("app/features/trading/order.test.ts"),
    ["consistency", "craft", "docs", "reliability", "standards"],
  ],
  [
    modified("app/features/measures/month-end-closes-for-test.ts"),
    ["consistency", "craft", "docs", "reliability", "standards"],
  ],
  [
    modified("e2e/prices.test.ts"),
    ["consistency", "craft", "docs", "reliability", "standards"],
  ],
  [
    { path: "app/features/trading/order-book.ts", change: "added" },
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    { path: "app/features/trading/order-book.ts", change: "deleted" },
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    { path: "docs/decisions/0017-a.md", change: "added" },
    ["consistency", "docs", "standards"],
  ],
  [
    modified("server/app.ts"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "product",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("migrations/0002_orders.sql"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("app/routes.ts"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "product",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("package.json"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("Dockerfile"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("compose.yaml"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified("Caddyfile"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified(".dockerignore"),
    [
      "architecture",
      "consistency",
      "craft",
      "docs",
      "reliability",
      "standards",
    ],
  ],
  [
    modified(".github/workflows/review.yml"),
    ["consistency", "craft", "docs", "reliability", "standards"],
  ],
  [
    modified(".claude/agents/review-craft.md"),
    ["consistency", "docs", "standards"],
  ],
];

for (const [file, chosen] of expectedLenses) {
  test(`chooses the lenses for ${file.change} ${file.path}`, () => {
    expect(chooseLenses([file])).toEqual(chosen);
  });
}

test("chooses every lens that applies to any of several files, in the order of the panel", () => {
  expect(
    chooseLenses([modified("docs/product.md"), modified("app/theme.css")]),
  ).toEqual(["consistency", "craft", "docs", "product", "standards"]);
});
