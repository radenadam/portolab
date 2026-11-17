interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseJavaScriptLimit = "220 kB";
const exerciseStylesheetLimit = "24 kB";

// Decisions 0049, 0053, 0054, 0055, 0056, 0057, and 0058 keep these allowances on their measured routes.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/market-data/market-page",
      { javascript: "202.3 kB", stylesheets: "21.2 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "217.3 kB", stylesheets: "21.3 kB" },
    ],
    [
      "features/classes/class-page",
      {
        javascript: exerciseJavaScriptLimit,
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/trading/ticket-page",
      {
        javascript: "225.3 kB",
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/trading/demonstration-summary-page",
      {
        javascript: exerciseJavaScriptLimit,
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/grading/student-portfolio-page",
      {
        javascript: exerciseJavaScriptLimit,
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/grading/student-measures-page",
      { javascript: exerciseJavaScriptLimit },
    ],
    ["features/measures/demonstration-analysis-page", { javascript: "206 kB" }],
    ["features/measures/measures-page", { javascript: "205.1 kB" }],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "143 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
