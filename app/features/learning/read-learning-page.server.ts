import type { RouterContextProvider } from "react-router";
import { requireReaderClass } from "~/features/classes/require-reader-class.server";
import { localizedLearningContent } from "./localized-learning-content.server";

export function readLearningPage(
  context: Readonly<RouterContextProvider>,
  url: URL,
  classIdText: string,
) {
  const classId = requireReaderClass(context, url, classIdText);
  const content = localizedLearningContent();
  if (!content.ok) throw new Error(content.failure);
  return { classId, content: content.value };
}
