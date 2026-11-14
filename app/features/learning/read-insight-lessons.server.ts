import { localizedLearningContent } from "./localized-learning-content.server";

/** The preview keeps the insight on the map while the reader opens its key idea. */
export function readInsightLessons() {
  const content = localizedLearningContent();
  if (!content.ok) throw new Error(content.failure);
  return content.value.sessions
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
