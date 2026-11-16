import { writeLog } from "~/write-log.server";
import { lessonTaskField, parseLessonTask } from "./lesson-task";

export function readLessonTask(url: URL) {
  const task = parseLessonTask(
    url.searchParams.get(lessonTaskField),
    lessonTaskField,
  );
  if (!task.ok) writeLog("warning", task.failure);
  return task.ok ? task.value : undefined;
}
