import type { Check } from "size-limit";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord, isStringArray } from "../app/value-shapes.ts";

const assetKinds = ["javascript", "stylesheets"] as const;
type ClientAssetKind = (typeof assetKinds)[number];

interface ClientChunk {
  file: string;
  imports: string[];
  dynamicImports: string[];
  stylesheets: string[];
  isEntry: boolean;
}

interface ClientRoute {
  file: string;
  parentId: string | undefined;
}

export function parseClientManifest(
  value: unknown,
  source: string,
): Result<Map<string, ClientChunk>, string> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return fail(
      `${source} must be a nonempty chunk manifest, but it is ${describeValue(value)}.`,
    );
  }
  const chunks = new Map<string, ClientChunk>();
  for (const [key, chunk] of Object.entries(value)) {
    const parsed = parseClientChunk(chunk, `${source}: ${key}`);
    if (!parsed.ok) return parsed;
    chunks.set(key, parsed.value);
  }
  return succeed(chunks);
}

function parseClientChunk(
  value: unknown,
  source: string,
): Result<ClientChunk, string> {
  if (!isRecord(value))
    return fail(
      `${source} must be a chunk, but it is ${describeValue(value)}.`,
    );
  if (typeof value["file"] !== "string" || value["file"] === "") {
    return fail(
      `${source}.file must be a nonempty path, but it is ${describeValue(value["file"])}.`,
    );
  }
  for (const field of ["imports", "dynamicImports"]) {
    if (value[field] !== undefined && !isStringArray(value[field])) {
      return fail(
        `${source}.${field} must be a list of chunk keys, but it is ${describeValue(value[field])}.`,
      );
    }
  }
  const stylesheets = parseStylesheetPaths(value["css"], `${source}.css`);
  if (!stylesheets.ok) return stylesheets;
  if (value["isEntry"] !== undefined && typeof value["isEntry"] !== "boolean") {
    return fail(
      `${source}.isEntry must be a boolean, but it is ${describeValue(value["isEntry"])}.`,
    );
  }
  return succeed({
    file: value["file"],
    imports: isStringArray(value["imports"]) ? value["imports"] : [],
    dynamicImports: isStringArray(value["dynamicImports"])
      ? value["dynamicImports"]
      : [],
    stylesheets: stylesheets.value,
    isEntry: value["isEntry"] === true,
  });
}

function parseStylesheetPaths(
  value: unknown,
  source: string,
): Result<string[], string> {
  if (value === undefined) return succeed([]);
  if (!isStringArray(value) || value.some((path) => path === ""))
    return fail(
      `${source} must be a list of nonempty stylesheet paths, but it is ${describeValue(value)}.`,
    );
  return succeed(value);
}

export function parseClientRoutes(
  value: unknown,
  source: string,
): Result<Map<string, ClientRoute>, string> {
  if (!isRecord(value) || Object.keys(value).length === 0) {
    return fail(
      `${source} must be a nonempty route manifest, but it is ${describeValue(value)}.`,
    );
  }
  const routes = new Map<string, ClientRoute>();
  for (const [id, route] of Object.entries(value)) {
    if (!isRecord(route)) {
      return fail(
        `${source}: ${id} must be a route, but it is ${describeValue(route)}.`,
      );
    }
    if (typeof route["file"] !== "string" || route["file"] === "") {
      return fail(
        `${source}: ${id}.file must be a nonempty path, but it is ${describeValue(route["file"])}.`,
      );
    }
    const parentId = route["parentId"];
    if (
      parentId !== undefined &&
      (typeof parentId !== "string" || parentId === "")
    ) {
      return fail(
        `${source}: ${id}.parentId must be a nonempty route id, but it is ${describeValue(parentId)}.`,
      );
    }
    routes.set(id, { file: route["file"], parentId });
  }
  return succeed(routes);
}

/** Counts the complete route, including ancestors and deferred enhancements, so moving an import behind an interaction cannot hide its cost. */
export function clientSizeChecks(
  chunks: ReadonlyMap<string, ClientChunk>,
  routes: ReadonlyMap<string, ClientRoute>,
  clientFiles: readonly string[],
): Result<Check[], string> {
  const bootstrap: string[] = [];
  const routeFiles = new Set([...routes.values()].map((route) => route.file));
  const routeEntries = new Map<string, string[]>(
    [...routeFiles].map((file) => [file, []]),
  );
  for (const [key, chunk] of chunks) {
    if (!chunk.isEntry) continue;
    const source = key.split("?")[0] ?? key;
    const entries = routeEntries.get(source);
    if (entries !== undefined) {
      entries.push(key);
    } else {
      bootstrap.push(key);
    }
  }
  if (bootstrap.length !== 1) {
    return fail(
      `The client manifest must have one bootstrap entry, but it has ${String(bootstrap.length)}.`,
    );
  }
  if (!routes.has("root")) return fail("The route manifest is missing root.");
  const knownFiles = new Set(clientFiles);
  const chunkFiles = new Set<string>();
  for (const chunk of chunks.values())
    chunkFiles.add(`build/client/${chunk.file}`);
  const routeAssets: RouteAssets[] = [];
  for (const [id] of routes) {
    const entries = ancestorEntries(routes, routeEntries, id);
    if (!entries.ok) return entries;
    const files = dependencyFiles(chunks, [...bootstrap, ...entries.value], id);
    if (!files.ok) return files;
    routeAssets.push({ id, files: files.value });
  }
  const routedStylesheets = new Set(
    routeAssets.flatMap((route) => route.files.stylesheets),
  );
  // A stylesheet with no owner in the route graph still needs a budget, even when the manifest lists it as an asset.
  const extraAssets: ClientAssets = {
    javascript: clientFiles.filter(
      (file) => file.endsWith(".js") && !chunkFiles.has(file),
    ),
    stylesheets: clientFiles.filter(
      (file) => file.endsWith(".css") && !routedStylesheets.has(file),
    ),
  };
  const checks = routeBudgetChecks(routeAssets, knownFiles, extraAssets);
  if (!checks.ok) return checks;
  checks.value.push(
    {
      name: "All client JavaScript (report only)",
      path: "build/client/**/*.js",
      gzip: true,
    },
    {
      name: "All client CSS (report only)",
      path: "build/client/**/*.css",
      gzip: true,
    },
  );
  return checks;
}

interface RouteAssets {
  id: string;
  files: ClientAssets;
}

function routeBudgetChecks(
  routeAssets: readonly RouteAssets[],
  knownFiles: ReadonlySet<string>,
  extraAssets: ClientAssets,
): Result<Check[], string> {
  const checks: Check[] = [];
  for (const { id, files } of routeAssets) {
    const routeLimits =
      id === "features/trading/ticket-page"
        ? { javascript: "210 kB", stylesheets: "21 kB" }
        : { javascript: "200 kB", stylesheets: "20 kB" };
    const budgets: Record<
      ClientAssetKind,
      { name: string; limit: string; label: string }
    > = {
      javascript: {
        name: id === "root" ? "Shared JavaScript" : `Route JavaScript: ${id}`,
        limit: id === "root" ? "140 kB" : routeLimits.javascript,
        label: "JavaScript",
      },
      stylesheets: {
        name: id === "root" ? "Shared CSS" : `Route CSS: ${id}`,
        limit: routeLimits.stylesheets,
        label: "CSS",
      },
    };
    for (const kind of assetKinds) {
      const budget = budgets[kind];
      const missing = files[kind].filter((file) => !knownFiles.has(file));
      if (missing.length > 0)
        return fail(
          `The client build is missing ${budget.label} files: ${missing.join(", ")}.`,
        );
      const paths = [...files[kind], ...extraAssets[kind]];
      if (paths.length > 0)
        checks.push({
          name: budget.name,
          limit: budget.limit,
          path: paths,
          gzip: true,
        });
    }
  }
  return succeed(checks);
}

function ancestorEntries(
  routes: ReadonlyMap<string, ClientRoute>,
  routeEntries: ReadonlyMap<string, string[]>,
  id: string,
): Result<string[], string> {
  const entries: string[] = [];
  const ancestors = new Set<string>();
  let current: string | undefined = id;
  while (current !== undefined) {
    if (ancestors.has(current))
      return fail(`The route manifest has a parent cycle at ${current}.`);
    ancestors.add(current);
    const route = routes.get(current);
    if (route === undefined)
      return fail(`The route manifest is missing parent ${current} of ${id}.`);
    const matching = routeEntries.get(route.file);
    if (matching === undefined || matching.length === 0)
      return fail(
        `The client manifest is missing the route entry for ${route.file}.`,
      );
    entries.push(...matching);
    current = route.parentId;
  }
  return ancestors.has("root")
    ? succeed(entries)
    : fail(`The route ${id} has no root ancestor.`);
}

type ClientAssets = Record<ClientAssetKind, string[]>;

function dependencyFiles(
  chunks: ReadonlyMap<string, ClientChunk>,
  entries: string[],
  routeId: string,
): Result<ClientAssets, string> {
  const pending = [...entries];
  const visited = new Set<string>();
  const javascript = new Set<string>();
  const stylesheets = new Set<string>();
  for (let key = pending.pop(); key !== undefined; key = pending.pop()) {
    if (visited.has(key)) continue;
    visited.add(key);
    const chunk = chunks.get(key);
    if (chunk === undefined)
      return fail(`The client manifest is missing imported chunk ${key}.`);
    if (chunk.file.endsWith(".js"))
      javascript.add(`build/client/${chunk.file}`);
    if (chunk.file.endsWith(".css"))
      stylesheets.add(`build/client/${chunk.file}`);
    for (const stylesheet of chunk.stylesheets)
      stylesheets.add(`build/client/${stylesheet}`);
    pending.push(...chunk.imports, ...chunk.dynamicImports);
  }
  if (javascript.size === 0)
    return fail(
      `The client manifest contains no JavaScript for route ${routeId}.`,
    );
  return succeed({
    javascript: [...javascript].sort(),
    stylesheets: [...stylesheets].sort(),
  });
}
