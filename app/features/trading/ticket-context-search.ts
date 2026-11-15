/** Drafts and success markers belong to the ticket, while the stock keeps its view and learning context. */
export function ticketContextSearch(query: URLSearchParams): string {
  const kept = new URLSearchParams(query);
  for (const name of [
    "lots",
    "price",
    "limit",
    "priceKind",
    "reason",
    "placed",
  ])
    kept.delete(name);
  const text = kept.toString();
  return text === "" ? "" : `?${text}`;
}
