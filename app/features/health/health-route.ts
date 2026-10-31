import { sql } from "drizzle-orm";
import { database } from "~/database/database.server";

/** Answers ok when the server can read its database, so a monitor can tell a running server from a broken one. */
export function loader(): Response {
  database().run(sql`select 1`);
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
