/** URL supplies encoding and replacement while callers keep local addresses. */
export function pathWithQuery(
  path: string,
  values: Readonly<Record<string, string | undefined>>,
): string {
  const address = new URL(path, "https://portolab.invalid");
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) address.searchParams.delete(name);
    else address.searchParams.set(name, value);
  }
  return `${address.pathname}${address.search}${address.hash}`;
}
