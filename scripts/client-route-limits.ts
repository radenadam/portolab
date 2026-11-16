interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseJavaScriptLimit = "220 kB";
const exerciseStylesheetLimit = "24 kB";

// Decisions 0049 and 0053 keep these allowances on their measured routes.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    ["features/measures/demonstration-analysis-page", { javascript: "201 kB" }],
    [
      "features/market-data/stock-page",
      { javascript: "212 kB", stylesheets: "21 kB" },
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
        javascript: exerciseJavaScriptLimit,
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
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "140 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
