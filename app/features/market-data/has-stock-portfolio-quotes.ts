import type { readStockPortfolio } from "./read-stock-portfolio.server";

export function hasStockPortfolioQuotes(
  stock: ReturnType<typeof readStockPortfolio>,
): boolean {
  return (
    (stock.holding?.kind === "priced" && stock.totalValue !== undefined) ||
    stock.correlation.ok ||
    (stock.tradePreview.impact.ok &&
      stock.tradePreview.impact.value.account.holdings.length > 0)
  );
}
