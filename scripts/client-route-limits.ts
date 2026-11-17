interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseJavaScriptLimit = "220 kB";
const exerciseStylesheetLimit = "24 kB";

// Decisions 0049, 0053, 0054, 0055, and 0056 keep these allowances on their measured routes.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    ["features/market-data/market-page", { stylesheets: "20.1 kB" }],
    [
      "features/market-data/stock-page",
      { javascript: "213.6 kB", stylesheets: "21 kB" },
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
        javascript: "221.5 kB",
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
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "202.6 kB" },
    ],
    ["features/measures/measures-page", { javascript: "201.7 kB" }],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "140.2 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
