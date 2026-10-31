import { sql } from "drizzle-orm";
import { databaseContext } from "~/database/database.server";
import type { Route } from "./+types/health-route";

/** Answers ok when the server can read its database, so a monitor can tell a running server from a broken one. */
export function loader({ context }: Route.LoaderArgs): Response {
  context.get(databaseContext).run(sql`select 1`);
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
