import { fileURLToPath } from "node:url";

// The server's entry and the tests import this module from its place in the source, so the folder is found from the code, wherever the server starts.
export const migrationsFolder = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);
