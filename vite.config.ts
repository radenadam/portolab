import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { readCheckSettings } from "./scripts/read-check-settings.ts";

export default defineConfig({
  server: { ws: { port: readCheckSettings().hotReload } },
  environments: {
    ssr: {
      build: {
        rolldownOptions: {
          input: "./server/app.ts",
        },
      },
    },
  },
  plugins: [
    paraglideVitePlugin({ project: "./project.inlang" }),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
