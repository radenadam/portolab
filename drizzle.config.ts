import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./app/features/*/*.schema.ts",
  out: "./migrations",
});
