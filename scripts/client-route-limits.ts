interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseStylesheetLimit = "24 kB";

// Decisions 0049 and 0057 record these allowances for complete lesson sheets.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "227.5 kB", stylesheets: "24.2 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "217.5 kB", stylesheets: "22 kB" },
    ],
    ["features/trading/activity-page", { javascript: "208 kB" }],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "221.5 kB", stylesheets: exerciseStylesheetLimit },
    ],
    ["features/trading/demonstration-activity-page", { javascript: "209 kB" }],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "223.5 kB", stylesheets: "21.2 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "222.7 kB", stylesheets: "20.6 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "227.2 kB", stylesheets: "22 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "235 kB", stylesheets: "24.8 kB" },
    ],
    ["features/grading/class-portfolios-page", { javascript: "203.7 kB" }],
    [
      "features/grading/student-portfolio-page",
      { javascript: "222.5 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "224 kB", stylesheets: "21.6 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "209 kB", stylesheets: "20.4 kB" },
    ],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "141 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
