interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

// Decisions 0049, 0060, 0061, 0063, 0065, 0067, and 0069 record these allowances for complete lesson sheets, the analysis panels, the stars of the watchlist, the welcome on Beranda, the parts that every screen shares, and the review of 19 November 2026.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "241.7 kB", stylesheets: "28.5 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "222.1 kB", stylesheets: "24.6 kB" },
    ],
    [
      "features/trading/activity-page",
      { javascript: "212.3 kB", stylesheets: "21 kB" },
    ],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "226.3 kB", stylesheets: "24.8 kB" },
    ],
    [
      "features/trading/demonstration-activity-page",
      { javascript: "213.1 kB", stylesheets: "21.6 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "231.5 kB", stylesheets: "24.1 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "230.7 kB", stylesheets: "23.5 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "232.2 kB", stylesheets: "25.1 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "240 kB", stylesheets: "28.1 kB" },
    ],
    [
      "features/grading/class-portfolios-page",
      { javascript: "207.6 kB", stylesheets: "20.9 kB" },
    ],
    [
      "features/grading/student-portfolio-page",
      { javascript: "227.2 kB", stylesheets: "25.2 kB" },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "232.2 kB", stylesheets: "24.5 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "213.6 kB", stylesheets: "22 kB" },
    ],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "143.7 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
