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
    },
    "app/root.tsx?route": {
      file: "assets/root.js",
      isEntry: true,
      imports: ["shared"],
    },
    "app/class.tsx?route": {
      file: "assets/class.js",
      isEntry: true,
      imports: ["shared"],
    },
    "app/market.tsx?route": {
      file: "assets/market.js",
      isEntry: true,
      imports: ["map"],
      dynamicImports: ["sheet"],
    },
    "app/market.tsx?clientLoader": {
      file: "assets/client-loader.js",
      isEntry: true,
      imports: ["ticket"],
    },
    "app/other.tsx?route": { file: "assets/other.js", isEntry: true },
    vendor: { file: "assets/vendor.js", imports: ["shared"] },
    shared: { file: "assets/shared.js", imports: ["vendor"] },
    map: { file: "assets/map.js", imports: ["shared", "map-alias"] },
    "map-alias": { file: "assets/map.js" },
    sheet: { file: "assets/sheet.js", dynamicImports: ["ticket"] },
    ticket: { file: "assets/ticket.js" },
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
  const files = [
    ...new Set(
      [...chunks.values()]
        .filter((chunk) => chunk.file.endsWith(".js"))
        .map((chunk) => `build/client/${chunk.file}`),
    ),
    "build/client/assets/manifest-hash.js",
  ];
  return { chunks, routes, files };
}

test("budgets every route with its ancestors, split exports, static imports, and deferred enhancements", () => {
  const { chunks, routes, files } = fixture();
  const checks = successValueForTest(
    clientSizeChecks(chunks, routes, files),
    "plans every budget",
  );
  expect(checks.map((check) => [check.name, check.limit, check.gzip])).toEqual([
    ["Shared JavaScript", "140 kB", true],
    ["Route JavaScript: class", "200 kB", true],
    ["Route JavaScript: market", "200 kB", true],
    ["Route JavaScript: other", "200 kB", true],
    ["All client JavaScript (report only)", undefined, true],
    ["Client CSS", "20 kB", true],
  ]);
  const shared = ["bootstrap", "root", "shared", "vendor"].map(
    (name) => `build/client/assets/${name}.js`,
  );
  const extra = "build/client/assets/manifest-hash.js";
  expect(checks[0]?.path).toEqual([...shared, extra]);
  expect(checks[2]?.path).toEqual([
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
  expect(checks[3]?.path).toEqual(
    [...shared, "build/client/assets/other.js"].sort().concat(extra),
  );
  expect(checks.at(-2)?.path).toBe("build/client/**/*.js");
  expect(checks.at(-1)?.path).toBe("build/client/assets/*.css");
});

test("discovers a new route without adding a budget entry by hand", () => {
  const { chunks, routes, files } = fixture();
  chunks.set("app/new.tsx?route", {
    file: "assets/new.js",
    isEntry: true,
    imports: [],
    dynamicImports: [],
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
