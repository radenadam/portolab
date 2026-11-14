import type { Locale } from "../../paraglide/runtime.js";
import type { Result } from "../../result.ts";
import type { LearningContent } from "./content.ts";
import { parseLearningContent } from "./parse-learning-content.ts";

// Vite embeds the prose in the server module, so a deployed build never depends on its working directory or a separate copy of the Markdown files.
const markdownFiles = import.meta.glob<string>("./content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

export function readLearningContent(): Result<
  Record<Locale, LearningContent>,
  string
> {
  return parseLearningContent(markdownFiles, "Learning content");
}
