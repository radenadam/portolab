/**
 * A value with the formula that computed it and the inputs of that formula, so a screen can show all three and a student can reproduce the value in a spreadsheet. The formulas, with the spreadsheet function that gives the same value:
 * - priceChange: R = (P_end - P_start) / P_start.
 * - mean: E(R) = ΣR / n, which is AVERAGE.
 * - sampleVariance: σ² = Σ(R - E(R))² / (n - 1), which is VAR.S.
 * - squareRoot: σ = √σ², which is STDEV.S of the returns.
 * - sampleCovariance: σ_AB = Σ(R_A - E(R_A))(R_B - E(R_B)) / (n - 1), which is COVARIANCE.S.
 * - correlation: ρ_AB = σ_AB / (σ_A σ_B), which is CORREL.
 * - beta: β = σ_iM / σ_M², which is SLOPE of the returns of the stock on those of the market.
 * - ratePerPeriod: R_f = the yearly rate / the periods in a year.
 * - capm: the required return R_f + β(E(R_M) - R_f).
 * - securityMarketLineDistance: α = E(R) - the required return, which is positive above the line.
 * - weightedSum: Σ w_i x_i, which is SUMPRODUCT.
 * - portfolioVariance: σ_p² = Σ_i Σ_j w_i w_j σ_ij, which is MMULT of the weights, the covariance matrix, and the weights.
 */
export interface Measure<Formula extends string, Value, Inputs> {
  formula: Formula;
  value: Value;
  inputs: Inputs;
}

/** Why a set of measures could not be computed. */
export type MeasureFailure =
  | {
      kind: "tooFewReturns";
      /** The instrument with the fewest returns in the window, which limits the periods that every instrument shares. */
      code: string;
      /** The periods in the window in which every instrument has a return. */
      count: number;
      minimum: number;
    }
  | {
      kind: "noRiskFreeRate";
      /** The last day of the window, for which no rate is recorded. */
      date: string;
    };
