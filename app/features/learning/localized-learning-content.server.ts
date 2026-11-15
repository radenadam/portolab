import { getLocale } from "../../paraglide/runtime.js";
import { succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import type { LearningContent } from "./content.ts";
import { readLearningContent } from "./read-learning-content.server.ts";

export function localizedLearningContent(): Result<LearningContent, string> {
  const content = readLearningContent();
  if (!content.ok) return content;
  const translation = content.value.find(
    (entry) => entry.locale === getLocale(),
  );
  if (translation === undefined) {
    throw new Error("The parsed learning content has no active language.");
  }
  return succeed(translation);
}
