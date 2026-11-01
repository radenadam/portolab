import { defineConfig } from "drizzle-kit";
import { migrationsFolderName } from "./app/database/migrations-folder-name.ts";

export default defineConfig({
  dialect: "sqlite",
  schema: "./app/features/*/*.schema.ts",
  out: `./${migrationsFolderName}`,
});
