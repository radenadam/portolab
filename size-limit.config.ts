import { globSync } from "node:fs";
import { exitWithFailure } from "./app/exit-with-failure.server.ts";
import {
  clientSizeChecks,
  parseClientManifest,
  parseClientRoutes,
} from "./scripts/client-size.ts";
import { readJsonFile } from "./scripts/json.ts";
import { writeScriptFailure } from "./scripts/write-script-failure.ts";

const manifest = readJsonFile(
  "build/client/.vite/manifest.json",
  parseClientManifest,
);
const routes = readJsonFile("build/routes.json", parseClientRoutes);
const problems: string[] = [];
if (!manifest.ok) problems.push(manifest.failure);
if (!routes.ok) problems.push(routes.failure);
if (!manifest.ok || !routes.ok) {
  exitWithFailure(problems, writeScriptFailure);
}
const checks = clientSizeChecks(
  manifest.value,
  routes.value,
  globSync("build/client/**/*.js").map((file) => file.replaceAll("\\", "/")),
);
if (!checks.ok) {
  exitWithFailure([checks.failure], writeScriptFailure);
}
export default checks.value;
