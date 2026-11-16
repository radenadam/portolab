import { parseGuideContent } from "./parse-guide-content.ts";

// The guide travels with the build, including on a home network without access to the repository.
const markdownFiles = import.meta.glob<string>("./guide/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
  exhaustive: true,
});

export function readGuideContent() {
  return parseGuideContent(markdownFiles, "Lecturer guide");
}
