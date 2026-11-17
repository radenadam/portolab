export const analysisAxes = ["beta", "risk"] as const;
export type AnalysisAxis = (typeof analysisAxes)[number];
export const defaultAnalysisAxis: AnalysisAxis = "beta";
