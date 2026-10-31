import { expect, test } from "vitest";
import { readJsonFile } from "./json.ts";
import { pageProblems, parseDevArguments } from "./dev-server-check.ts";

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
    failure: "package.json has no dev script.",
  });
});

test("accepts pages that answer with success and names each page that does not", () => {
  expect(
    pageProblems([
      { path: "/health", status: 200 },
      { path: "/prices", status: 500 },
      { path: "/missing", status: 404 },
    ]),
  ).toEqual([
    "/prices answered with status 500.",
    "/missing answered with status 404.",
  ]);
});
