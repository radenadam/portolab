interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseStylesheetLimit = "24 kB";

// Decisions 0049 and 0060 record these allowances for complete lesson sheets, and decision 0061 those for the stars of the watchlist.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "235.2 kB", stylesheets: "25.7 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "220.9 kB", stylesheets: "23.1 kB" },
    ],
    [
      "features/trading/activity-page",
      { javascript: "211.1 kB", stylesheets: "20.4 kB" },
    ],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "224.2 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/trading/demonstration-activity-page",
      { javascript: "211.9 kB", stylesheets: "21.1 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "226.2 kB", stylesheets: "22 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "225.3 kB", stylesheets: "21.4 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "230.4 kB", stylesheets: "23.2 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "238.1 kB", stylesheets: "25.8 kB" },
    ],
    [
      "features/grading/class-portfolios-page",
      { javascript: "206.3 kB", stylesheets: "20.5 kB" },
    ],
    [
      "features/grading/student-portfolio-page",
      { javascript: "225 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "226.7 kB", stylesheets: "22.4 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "212.2 kB", stylesheets: "21.4 kB" },
    ],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "142.9 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
