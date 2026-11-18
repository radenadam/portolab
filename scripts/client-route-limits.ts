interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseStylesheetLimit = "24 kB";

// Decisions 0049, 0060, 0061, 0063, 0065, and 0067 record these allowances for complete lesson sheets, the analysis panels, the stars of the watchlist, the welcome on Beranda, and the parts that every screen shares.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "241.7 kB", stylesheets: "27.9 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "222.1 kB", stylesheets: "23.6 kB" },
    ],
    [
      "features/trading/activity-page",
      { javascript: "212.3 kB", stylesheets: "20.7 kB" },
    ],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "226.3 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/trading/demonstration-activity-page",
      { javascript: "213.1 kB", stylesheets: "21.3 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "231.4 kB", stylesheets: "23.2 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "230.5 kB", stylesheets: "22.5 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "232.1 kB", stylesheets: "23.9 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "239.8 kB", stylesheets: "26.6 kB" },
    ],
    [
      "features/grading/class-portfolios-page",
      { javascript: "207.6 kB", stylesheets: "20.8 kB" },
    ],
    [
      "features/grading/student-portfolio-page",
      { javascript: "227.2 kB", stylesheets: "24.3 kB" },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "232 kB", stylesheets: "23.6 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "213.6 kB", stylesheets: "21.7 kB" },
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
