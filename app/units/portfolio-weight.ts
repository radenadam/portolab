/** The share of the value of a portfolio that one holding has, as a fraction from 0 to 1, such as 0.25. */
export type PortfolioWeight = number & { readonly brand: "PortfolioWeight" };

function isPortfolioWeight(value: number): value is PortfolioWeight {
  return value >= 0 && value <= 1;
}

/** Makes a share of the value of a portfolio that the program holds into a weight. A holding can never be worth less than nothing or more than the whole portfolio, so a value outside 0 to 1 is a defect. */
export function portfolioWeight(fraction: number): PortfolioWeight {
  if (!isPortfolioWeight(fraction)) {
    throw new Error(`${String(fraction)} is not a share of a portfolio.`);
  }
  return fraction;
}
