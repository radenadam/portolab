interface ClientRouteLimits {
  javascript: string;
  stylesheets: string;
}

const exerciseJavaScriptLimit = "220 kB";
const exerciseStylesheetLimit = "24 kB";

// Each entry holds the ceiling that the latest decision record about its route measured, and that record names this file.
const measuredRoutes: ReadonlyMap<string, Partial<ClientRouteLimits>> = new Map(
  [
    [
      "features/market-data/market-page",
      { javascript: "200.3 kB", stylesheets: "20.8 kB" },
    ],
    [
      "features/market-data/stock-page",
      { javascript: "215.6 kB", stylesheets: "21 kB" },
    ],
    [
      "features/classes/class-page",
      {
        javascript: "220.7 kB",
        stylesheets: exerciseStylesheetLimit,
      },
    ],
    [
      "features/trading/ticket-page",
      {
        javascript: "223.5 kB",
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
      { javascript: exerciseJavaScriptLimit, stylesheets: "21 kB" },
    ],
    [
      "features/measures/demonstration-analysis-page",
      { javascript: "211 kB", stylesheets: "20.5 kB" },
    ],
    ["features/measures/measures-page", { javascript: "210 kB" }],
  ],
);

export function clientRouteLimits(id: string): ClientRouteLimits {
  const measured = measuredRoutes.get(id);
  return {
    javascript: id === "root" ? "142.1 kB" : (measured?.javascript ?? "200 kB"),
    stylesheets: measured?.stylesheets ?? "20 kB",
  };
}
