import type { Config } from "@react-router/dev/config";
import { writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const config: Config = {
  buildEnd({ buildManifest, reactRouterConfig, viteConfig }) {
    if (buildManifest === undefined) {
      throw new Error("The build must provide its route manifest.");
    }
    const routes = Object.fromEntries(
      Object.entries(buildManifest.routes).map(([id, route]) => [
        id,
        {
          file: relative(
            viteConfig.root,
            join(reactRouterConfig.appDirectory, route.file),
          ).replaceAll("\\", "/"),
          parentId: route.parentId,
        },
      ]),
    );
    writeFileSync(
      join(reactRouterConfig.buildDirectory, "routes.json"),
      JSON.stringify(routes),
    );
  },
  ssr: true,
  // Decision 0005 explains why the middleware of the root route checks the origin of every form instead of React Router.
  allowedActionOrigins: ["**"],
};

export default config;
