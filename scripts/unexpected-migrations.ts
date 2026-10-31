import { listOfWords, singularOrPlural } from "./sentences.ts";

/** Returns a sentence when drizzle-kit generated migration files, which means that the schema changed without its migration. */
export function unexpectedMigrations(
  filesBefore: readonly string[],
  filesAfter: readonly string[],
): string | undefined {
  const created = filesAfter.filter((file) => !filesBefore.includes(file));
  if (created.length === 0) {
    return undefined;
  }
  const pronoun = singularOrPlural(created.length, "it", "them");
  return `The schema changed without a migration, so drizzle-kit generated ${listOfWords(created)}. Review ${pronoun} and commit ${pronoun} with the schema change.`;
}
