interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseStylesheetLimit = "24 kB";

// Decisions 0049, 0060, 0061, 0063, and 0064 record these allowances for complete lesson sheets, the analysis panels, the stars of the watchlist, and the parts that every screen shares.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "236.3 kB", stylesheets: "26 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "221.7 kB", stylesheets: "23.4 kB" },
    ],
    [
      "features/trading/activity-page",
      { javascript: "211.8 kB", stylesheets: "20.4 kB" },
    ],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "225.2 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/trading/demonstration-activity-page",
      { javascript: "212.7 kB", stylesheets: "21.1 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "230.9 kB", stylesheets: "22.9 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "230.1 kB", stylesheets: "22.4 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "231.2 kB", stylesheets: "23.5 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "239 kB", stylesheets: "26.1 kB" },
    ],
    [
      "features/grading/class-portfolios-page",
      { javascript: "207.1 kB", stylesheets: "20.5 kB" },
    ],
    [
      "features/grading/student-portfolio-page",
      { javascript: "226 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "231.4 kB", stylesheets: "23.3 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "213 kB", stylesheets: "21.4 kB" },
    ],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "143.4 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
