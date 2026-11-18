import { expect, test } from "vitest";
import { successValueForTest } from "../app/success-value-for-test.ts";
import {
  clientSizeChecks,
  parseClientManifest,
  parseClientRoutes,
} from "./client-size.ts";

function fixture() {
  const manifest: Record<string, unknown> = {
    "entry.client.tsx": {
      file: "assets/bootstrap.js",
      isEntry: true,
      imports: ["vendor"],
      css: ["assets/bootstrap.css"],
    },
    "app/root.tsx?route": {
      file: "assets/root.js",
      isEntry: true,
      imports: ["shared"],
      css: ["assets/root.css"],
    },
    "app/class.tsx?route": {
      file: "assets/class.js",
      isEntry: true,
      imports: ["shared"],
      css: ["assets/class.css"],
    },
    "app/market.tsx?route": {
      file: "assets/market.js",
      isEntry: true,
      imports: ["map"],
      dynamicImports: ["sheet"],
      css: ["assets/market.css"],
    },
    "app/market.tsx?clientLoader": {
      file: "assets/client-loader.js",
      isEntry: true,
      imports: ["ticket"],
    },
    "app/other.tsx?route": {
      file: "assets/other.js",
      isEntry: true,
      css: ["assets/other.css"],
    },
    vendor: { file: "assets/vendor.js", imports: ["shared"] },
    shared: {
      file: "assets/shared.js",
      imports: ["vendor"],
      css: ["assets/shared.css"],
    },
    map: {
      file: "assets/map.js",
      imports: ["shared", "map-alias", "stylesheet"],
      css: ["assets/map.css"],
    },
    "map-alias": {
      file: "assets/map.js",
      css: ["assets/map.css", "assets/shared.css"],
    },
    sheet: {
      file: "assets/sheet.js",
      dynamicImports: ["ticket"],
      css: ["assets/sheet.css"],
    },
    ticket: { file: "assets/ticket.js", css: ["assets/ticket.css"] },
    stylesheet: { file: "assets/standalone.css" },
    font: { file: "assets/font.woff2" },
  };
  const routeManifest: Record<string, unknown> = {
    root: { file: "app/root.tsx" },
    class: { file: "app/class.tsx", parentId: "root" },
    market: { file: "app/market.tsx", parentId: "class" },
    other: { file: "app/other.tsx", parentId: "root" },
  };
  const chunks = successValueForTest(
    parseClientManifest(manifest, "vite.json"),
    "reads the Vite fixture",
  );
  const routes = successValueForTest(
    parseClientRoutes(routeManifest, "routes.json"),
    "reads the route fixture",
  );
  const files = new Set([
    "build/client/assets/manifest-hash.js",
    "build/client/assets/manual.css",
  ]);
  for (const chunk of chunks.values()) {
    if (chunk.file.endsWith(".js") || chunk.file.endsWith(".css"))
      files.add(`build/client/${chunk.file}`);
    for (const stylesheet of chunk.stylesheets)
      files.add(`build/client/${stylesheet}`);
  }
  return { chunks, routes, files: [...files] };
}

test("budgets every route with its ancestors, split exports, static imports, and deferred enhancements", () => {
  const { chunks, routes, files } = fixture();
  const checks = successValueForTest(
    clientSizeChecks(chunks, routes, files),
    "plans every budget",
  );
  expect(checks.map((check) => [check.name, check.limit, check.gzip])).toEqual([
    ["Shared JavaScript", "142.8 kB", true],
    ["Shared CSS", "20 kB", true],
    ["Route JavaScript: class", "200 kB", true],
    ["Route CSS: class", "20 kB", true],
    ["Route JavaScript: market", "200 kB", true],
    ["Route CSS: market", "20 kB", true],
    ["Route JavaScript: other", "200 kB", true],
    ["Route CSS: other", "20 kB", true],
    ["All client JavaScript (report only)", undefined, true],
    ["All client CSS (report only)", undefined, true],
  ]);
  const shared = ["bootstrap", "root", "shared", "vendor"].map(
    (name) => `build/client/assets/${name}.js`,
  );
  const extra = "build/client/assets/manifest-hash.js";
  expect(checks[0]?.path).toEqual([...shared, extra]);
  expect(
    checks.find((check) => check.name === "Route JavaScript: market")?.path,
  ).toEqual([
    ...[
      "bootstrap",
      "class",
      "client-loader",
      "map",
      "market",
      "root",
      "shared",
      "sheet",
      "ticket",
      "vendor",
    ].map((name) => `build/client/assets/${name}.js`),
    extra,
  ]);
  expect(
    checks.find((check) => check.name === "Route JavaScript: other")?.path,
  ).toEqual([...shared, "build/client/assets/other.js"].sort().concat(extra));
  expect(checks.at(-2)?.path).toBe("build/client/**/*.js");
  expect(
    checks.find((check) => check.name === "Route CSS: market")?.path,
  ).toEqual([
    ...[
      "bootstrap",
      "class",
      "map",
      "market",
      "root",
      "shared",
      "sheet",
      "standalone",
      "ticket",
    ].map((name) => `build/client/assets/${name}.css`),
    "build/client/assets/manual.css",
  ]);
  expect(
    checks.find((check) => check.name === "Route CSS: other")?.path,
  ).toEqual([
    ...["bootstrap", "other", "root", "shared"].map(
      (name) => `build/client/assets/${name}.css`,
    ),
    "build/client/assets/manual.css",
  ]);
  expect(checks.at(-1)?.path).toBe("build/client/**/*.css");
});

test("discovers a new route without adding a budget entry by hand", () => {
  const { chunks, routes, files } = fixture();
  chunks.set("app/new.tsx?route", {
    file: "assets/new.js",
    isEntry: true,
    imports: [],
    dynamicImports: [],
    stylesheets: [],
  });
  routes.set("new", { file: "app/new.tsx", parentId: "root" });
  files.push("build/client/assets/new.js");
  const checks = successValueForTest(
    clientSizeChecks(chunks, routes, files),
    "discovers the route",
  );
  const added = checks.find((check) => check.name === "Route JavaScript: new");
  expect(added?.limit).toBe("200 kB");
  expect(added?.path).toContain("build/client/assets/new.js");
});

test("applies measured route allowances only to the named routes and asset kinds", () => {
  const { chunks, routes, files } = fixture();
  const cases = [
    ["features/classes/class-page", "235.5 kB", "25.7 kB"],
    ["features/market-data/stock-page", "229.8 kB", "22.9 kB"],
    ["features/market-data/stock-page-detail", "200 kB", "20 kB"],
    ["features/market-data/market-page", "219.9 kB", "22.7 kB"],
    ["features/classes/class-page-detail", "200 kB", "20 kB"],
    ["features/market-data/market-page-detail", "200 kB", "20 kB"],
    ["features/trading/ticket-page", "237.6 kB", "25.8 kB"],
    ["features/trading/activity-page", "211.1 kB", "20.4 kB"],
    ["features/trading/demonstration-summary-page", "224.2 kB", "24 kB"],
    ["features/trading/demonstration-activity-page", "212.1 kB", "21.1 kB"],
    ["features/measures/measures-page", "229.5 kB", "22.2 kB"],
    ["features/measures/measures-page-detail", "200 kB", "20 kB"],
    ["features/measures/demonstration-analysis-page", "230.4 kB", "22.9 kB"],
    ["features/measures/demonstration-analysis-page-detail", "200 kB", "20 kB"],
    ["features/grading/class-portfolios-page", "206.5 kB", "20.5 kB"],
    ["features/grading/student-portfolio-page", "225.3 kB", "24 kB"],
    ["features/grading/student-measures-page", "230.9 kB", "23.3 kB"],
    ["features/grading/student-journal-page", "212.5 kB", "21.4 kB"],
    ["features/grading/student-measures-page-detail", "200 kB", "20 kB"],
    ["features/learning/lesson-page", "200 kB", "20 kB"],
    ["features/learning/price-guide-page", "200 kB", "20 kB"],
    ["features/trading/ticket-page-detail", "200 kB", "20 kB"],
  ] as const;
  for (const [id, javascript, stylesheets] of cases) {
    routes.set(id, { file: "app/other.tsx", parentId: "root" });
    const checks = successValueForTest(
      clientSizeChecks(chunks, routes, files),
      "plans measured route limits",
    );
    expect(
      checks.find((check) => check.name === `Route JavaScript: ${id}`)?.limit,
    ).toBe(javascript);
    expect(
      checks.find((check) => check.name === `Route CSS: ${id}`)?.limit,
    ).toBe(stylesheets);
  }
});

test("keeps child budgets and stylesheet dependencies unchanged by an allowance", () => {
  const { chunks, routes, files } = fixture();
  routes.set("features/classes/class-page", {
    file: "app/class.tsx",
    parentId: "root",
  });
  routes.set("class-child", {
    file: "app/other.tsx",
    parentId: "features/classes/class-page",
  });
  const checks = successValueForTest(
    clientSizeChecks(chunks, routes, files),
    "plans the class allowance",
  );
  const completeRoute = checks.find(
    (check) => check.name === "Route CSS: features/classes/class-page",
  );
  expect(completeRoute).toBeDefined();
  expect(
    checks.find((check) => check.name === "Route CSS: class-child")?.limit,
  ).toBe("20 kB");
  expect(completeRoute?.path).toEqual(
    checks.find((check) => check.name === "Route CSS: class")?.path,
  );
});

test("rejects missing files even when the other files of the route exist", () => {
  const { chunks, routes, files } = fixture();
  expect(
    clientSizeChecks(
      chunks,
      routes,
      files.filter((file) => !file.endsWith("/map.js")),
    ),
  ).toEqual({
    ok: false,
    failure:
      "The client build is missing JavaScript files: build/client/assets/map.js.",
  });
});

test("rejects a stylesheet missing from the build, including one shared by aliases", () => {
  const { chunks, routes, files } = fixture();
  expect(
    clientSizeChecks(
      chunks,
      routes,
      files.filter((file) => !file.endsWith("/map.css")),
    ),
  ).toEqual({
    ok: false,
    failure:
      "The client build is missing CSS files: build/client/assets/map.css.",
  });
});

test("counts a stylesheet without a route owner on every route even when the manifest lists its asset", () => {
  const { chunks, routes, files } = fixture();
  const path = "build/client/assets/unassigned.css";
  chunks.set("unassigned", {
    file: "assets/unassigned.css",
    imports: [],
    dynamicImports: [],
    stylesheets: [],
    isEntry: false,
  });
  files.push(path);
  const checks = successValueForTest(
    clientSizeChecks(chunks, routes, files),
    "budgets the unassigned asset",
  );
  const stylesheets = checks.filter(
    (check) =>
      check.name === "Shared CSS" || check.name?.startsWith("Route CSS:"),
  );
  expect(stylesheets).toHaveLength(routes.size);
  for (const stylesheet of stylesheets) expect(stylesheet.path).toContain(path);
});

const brokenGraphs: [
  string,
  (data: ReturnType<typeof fixture>) => void,
  string,
][] = [
  [
    "a missing bootstrap",
    ({ chunks }) => {
      chunks.delete("entry.client.tsx");
    },
    "The client manifest must have one bootstrap entry, but it has 0.",
  ],
  [
    "an unknown entry",
    ({ chunks }) => {
      chunks.set("unknown", {
        file: "unknown.js",
        imports: [],
        dynamicImports: [],
        stylesheets: [],
        isEntry: true,
      });
    },
    "The client manifest must have one bootstrap entry, but it has 2.",
  ],
  [
    "a missing route entry",
    ({ chunks }) => {
      chunks.delete("app/market.tsx?route");
      chunks.delete("app/market.tsx?clientLoader");
    },
    "The client manifest is missing the route entry for app/market.tsx.",
  ],
  [
    "a missing static import",
    ({ chunks }) => {
      chunks.delete("vendor");
    },
    "The client manifest is missing imported chunk vendor.",
  ],
  [
    "a missing dynamic import",
    ({ chunks }) => {
      chunks.delete("sheet");
    },
    "The client manifest is missing imported chunk sheet.",
  ],
  [
    "a missing parent",
    ({ routes }) => {
      routes.set("market", { file: "app/market.tsx", parentId: "missing" });
    },
    "The route manifest is missing parent missing of market.",
  ],
  [
    "a parent cycle",
    ({ routes }) => {
      routes.set("market", { file: "app/market.tsx", parentId: "market" });
    },
    "The route manifest has a parent cycle at market.",
  ],
  [
    "a route outside root",
    ({ routes }) => {
      routes.set("market", { file: "app/market.tsx", parentId: undefined });
    },
    "The route market has no root ancestor.",
  ],
];
for (const [name, breakGraph, failure] of brokenGraphs) {
  test(`rejects ${name}`, () => {
    const data = fixture();
    breakGraph(data);
    expect(clientSizeChecks(data.chunks, data.routes, data.files)).toEqual({
      ok: false,
      failure,
    });
  });
}

test("rejects a manifest without root", () => {
  const { chunks, routes, files } = fixture();
  routes.delete("root");
  chunks.delete("app/root.tsx?route");
  expect(clientSizeChecks(chunks, routes, files)).toEqual({
    ok: false,
    failure: "The route manifest is missing root.",
  });
});

test("names the route whose graph contains no JavaScript", () => {
  const chunks = successValueForTest(
    parseClientManifest(
      {
        bootstrap: { file: "boot.css", isEntry: true },
        "app/root.tsx?route": { file: "root.css", isEntry: true },
        "app/child.tsx?route": { file: "child.css", isEntry: true },
      },
      "vite.json",
    ),
    "reads stylesheet entries",
  );
  const routes = successValueForTest(
    parseClientRoutes(
      {
        child: { file: "app/child.tsx", parentId: "root" },
        root: { file: "app/root.tsx" },
      },
      "routes.json",
    ),
    "reads both routes",
  );
  expect(routes.size).toBe(2);
  expect(clientSizeChecks(chunks, routes, [])).toEqual({
    ok: false,
    failure: "The client manifest contains no JavaScript for route child.",
  });
});

const invalidChunks: [unknown, string][] = [
  [null, "vite.json must be a nonempty chunk manifest, but it is null."],
  [{}, "vite.json must be a nonempty chunk manifest, but it is {}."],
  [{ chunk: 3 }, "vite.json: chunk must be a chunk, but it is 3."],
  [
    { chunk: {} },
    "vite.json: chunk.file must be a nonempty path, but it is missing.",
  ],
  [
    { chunk: { file: "" } },
    "vite.json: chunk.file must be a nonempty path, but it is empty.",
  ],
  [
    { chunk: { file: "a.js", imports: [1] } },
    "vite.json: chunk.imports must be a list of chunk keys, but it is [1].",
  ],
  [
    { chunk: { file: "a.js", dynamicImports: null } },
    "vite.json: chunk.dynamicImports must be a list of chunk keys, but it is null.",
  ],
  [
    { chunk: { file: "a.js", isEntry: "true" } },
    'vite.json: chunk.isEntry must be a boolean, but it is "true".',
  ],
  [
    { chunk: { file: "a.js", css: [1] } },
    "vite.json: chunk.css must be a list of nonempty stylesheet paths, but it is [1].",
  ],
  [
    { chunk: { file: "a.js", css: null } },
    "vite.json: chunk.css must be a list of nonempty stylesheet paths, but it is null.",
  ],
  [
    { chunk: { file: "a.js", css: [""] } },
    'vite.json: chunk.css must be a list of nonempty stylesheet paths, but it is [""].',
  ],
];
for (const [value, failure] of invalidChunks) {
  test(`rejects invalid chunk input with ${failure}`, () => {
    expect(parseClientManifest(value, "vite.json")).toEqual({
      ok: false,
      failure,
    });
  });
}

const invalidRoutes: [unknown, string][] = [
  [[], "routes.json must be a nonempty route manifest, but it is []."],
  [{}, "routes.json must be a nonempty route manifest, but it is {}."],
  [{ root: null }, "routes.json: root must be a route, but it is null."],
  [
    { root: { file: 4 } },
    "routes.json: root.file must be a nonempty path, but it is 4.",
  ],
  [
    { root: { file: "" } },
    "routes.json: root.file must be a nonempty path, but it is empty.",
  ],
  [
    { root: { file: "root.tsx", parentId: 4 } },
    "routes.json: root.parentId must be a nonempty route id, but it is 4.",
  ],
  [
    { root: { file: "root.tsx", parentId: "" } },
    "routes.json: root.parentId must be a nonempty route id, but it is empty.",
  ],
];
for (const [value, failure] of invalidRoutes) {
  test(`rejects invalid route input with ${failure}`, () => {
    expect(parseClientRoutes(value, "routes.json")).toEqual({
      ok: false,
      failure,
    });
  });
}
