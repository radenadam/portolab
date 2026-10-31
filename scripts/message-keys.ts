/** Returns one sentence for each key that a language lacks, or that does not start with a feature folder or with app. */
export function messageKeyProblems(
  keysByLanguage: ReadonlyMap<string, readonly string[]>,
  featureFolders: readonly string[],
): string[] {
  const allowedPrefixes = [
    "app",
    ...featureFolders.map((folder) => folder.replaceAll("-", "_")),
  ];
  const allKeys = new Set([...keysByLanguage.values()].flat());
  const problems: string[] = [];
  for (const key of allKeys) {
    for (const [language, keys] of keysByLanguage) {
      if (!keys.includes(key)) {
        problems.push(`messages/${language}.json: add the message "${key}".`);
      }
    }
    if (!allowedPrefixes.some((prefix) => key.startsWith(`${prefix}_`))) {
      problems.push(
        `"${key}": start the key with the feature folder that uses it, or with "app_" when the whole app shares it.`,
      );
    }
  }
  return problems;
}
