import { getLocale } from "~/paraglide/runtime.js";
import { readLearningContent } from "./read-learning-content.server";

/** The insight opens its lesson's key idea in place while the complete lesson pages are rebuilt in #127. */
export function readInsightLessons() {
  const content = readLearningContent();
  if (!content.ok) throw new Error(content.failure);
  const translation = content.value.find(
    ({ locale }) => locale === getLocale(),
  );
  if (translation === undefined)
    throw new Error("The parsed learning content has no active language.");
  return translation.sessions
    .map((lesson) => ({
      session: lesson.session,
      title: lesson.title,
      paragraphs: lesson.sections.flatMap((section) =>
        section.id === "key-idea"
          ? section.blocks.flatMap((block) =>
              block.kind === "paragraph" ? [block.text] : [],
            )
          : [],
      ),
    }))
    .filter((lesson) => lesson.paragraphs.length > 0);
}
