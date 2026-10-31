import { createRequestHandler } from "@react-router/express";
import express from "express";
import type { Express } from "express";
import { RouterContextProvider } from "react-router";
import type { ServerBuild } from "react-router";

export const app: Express = express();

app.use(
  createRequestHandler({
    // The virtual module types `basename` as `string | undefined`, which exactOptionalPropertyTypes rejects for ServerBuild.
    build: () =>
      import("virtual:react-router/server-build") as Promise<ServerBuild>,
    getLoadContext() {
      return new RouterContextProvider();
    },
  }),
);
