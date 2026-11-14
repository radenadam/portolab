import type { Check } from "size-limit";
import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue, isRecord, isStringArray } from "../app/value-shapes.ts";

interface ClientChunk {
  file: string;
  imports: string[];
  dynamicImports: string[];
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
    isEntry: value["isEntry"] === true,
  });
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
  const chunkFiles = new Set(
    [...chunks.values()].map((chunk) => `build/client/${chunk.file}`),
  );
  // React Router writes its browser manifest outside Vite's chunk graph, so any unlisted JavaScript counts on every route.
  const extraFiles = clientFiles.filter((file) => !chunkFiles.has(file));
  const checks: Check[] = [];
  for (const [id] of routes) {
    const entries = ancestorEntries(routes, routeEntries, id);
    if (!entries.ok) return entries;
    const files = javascriptFiles(chunks, [...bootstrap, ...entries.value], id);
    if (!files.ok) return files;
    const missing = files.value.filter((file) => !knownFiles.has(file));
    if (missing.length > 0)
      return fail(
        `The client build is missing JavaScript files: ${missing.join(", ")}.`,
      );
    const budget =
      id === "root"
        ? { name: "Shared JavaScript", limit: "140 kB" }
        : { name: `Route JavaScript: ${id}`, limit: "200 kB" };
    checks.push({
      ...budget,
      path: [...files.value, ...extraFiles],
      gzip: true,
    });
  }
  checks.push(
    {
      name: "All client JavaScript (report only)",
      path: "build/client/**/*.js",
      gzip: true,
    },
    {
      name: "Client CSS",
      path: "build/client/assets/*.css",
      limit: "20 kB",
      gzip: true,
    },
  );
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

function javascriptFiles(
  chunks: ReadonlyMap<string, ClientChunk>,
  entries: string[],
  routeId: string,
): Result<string[], string> {
  const pending = [...entries];
  const visited = new Set<string>();
  const files = new Set<string>();
  for (let key = pending.pop(); key !== undefined; key = pending.pop()) {
    if (visited.has(key)) continue;
    visited.add(key);
    const chunk = chunks.get(key);
    if (chunk === undefined)
      return fail(`The client manifest is missing imported chunk ${key}.`);
    if (chunk.file.endsWith(".js")) files.add(`build/client/${chunk.file}`);
    pending.push(...chunk.imports, ...chunk.dynamicImports);
  }
  if (files.size === 0)
    return fail(
      `The client manifest contains no JavaScript for route ${routeId}.`,
    );
  return succeed([...files].sort());
}
