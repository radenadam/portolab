import type { Database } from "~/database/database.server";
import { sampleClassMarker } from "./sample-class-marker.schema";

export function isSampleClass(database: Database): boolean {
  return database.select().from(sampleClassMarker).get() !== undefined;
}
