import { writeLog } from "~/write-log.server";
import { parseLessonTask } from "./lesson-task";

export function readLessonTask(url: URL) {
  const task = parseLessonTask(
    url.searchParams.get("lessonTask"),
    "lessonTask",
  );
  if (!task.ok) writeLog("warning", task.failure);
  return task.ok ? task.value : undefined;
}
