interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseJavaScriptLimit = "220 kB";
const exerciseStylesheetLimit = "24 kB";

// Decisions 0049, 0053, 0054, 0055, 0056, 0057, 0058, 0059, and 0060 keep these allowances on their measured routes.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/market-data/market-page",
      { javascript: "201.6 kB", stylesheets: "21.4 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "216.5 kB", stylesheets: "21.5 kB" },
    ],
    [
      "features/classes/class-page",
      {
        javascript: "221 kB",
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/trading/ticket-page",
      {
        javascript: "224.4 kB",
        stylesheets: "24.3 kB",
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
      { javascript: "205.1 kB" },
    ],
    ["features/measures/measures-page", { javascript: "204.2 kB" }],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "142.1 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
