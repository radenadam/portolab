import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
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
