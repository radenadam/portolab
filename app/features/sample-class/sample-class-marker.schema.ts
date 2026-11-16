import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

/** Deleting people must not remove the warning, so the marker lives until the operator deletes the database. */
export const sampleClassMarker = sqliteTable("sample_class_marker", {
  id: integer("id").primaryKey(),
});
