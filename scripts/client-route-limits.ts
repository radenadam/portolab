interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseStylesheetLimit = "24 kB";

// Decisions 0049 and 0058 record these allowances for complete lesson sheets.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/classes/class-page",
      { javascript: "229.2 kB", stylesheets: "24.6 kB" },
    ],
    [
      "features/market-data/market-page",
      { javascript: "219 kB", stylesheets: "22.3 kB" },
    ],
    ["features/trading/activity-page", { javascript: "209.6 kB" }],
    [
      "features/trading/demonstration-summary-page",
      { javascript: "223.1 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/trading/demonstration-activity-page",
      { javascript: "210.4 kB", stylesheets: "20.4 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "225.2 kB", stylesheets: "21.6 kB" },
    ],
    [
      "features/measures/measures-page",
      { javascript: "224.3 kB", stylesheets: "20.9 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "228.6 kB", stylesheets: "22.5 kB" },
    ],
    [
      "features/trading/ticket-page",
      { javascript: "236.3 kB", stylesheets: "25.3 kB" },
    ],
    ["features/grading/class-portfolios-page", { javascript: "205.3 kB" }],
    [
      "features/grading/student-portfolio-page",
      { javascript: "223.9 kB", stylesheets: exerciseStylesheetLimit },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: "225.7 kB", stylesheets: "21.9 kB" },
    ],
    [
      "features/grading/student-journal-page",
      { javascript: "210.7 kB", stylesheets: "20.8 kB" },
    ],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "142.6 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
