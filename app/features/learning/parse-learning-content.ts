import { locales } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue, isRecord } from "../../value-shapes.ts";
import type { LearningContent, LocalizedLearningContent } from "./content.ts";
import { sessionKinds } from "./content.ts";
import { contentParityProblems } from "./content-parity-problems.ts";
import { parseGlossary } from "./parse-glossary.ts";
import { parseSessionContent } from "./parse-session-content.ts";

export function parseLearningContent(
  value: unknown,
  source: string,
): Result<LocalizedLearningContent[], string> {
  if (!isRecord(value)) {
    return fail(
      `${source} must map content paths to Markdown, but it is ${describeValue(value)}.`,
    );
  }
  const content = locales.map((locale): LocalizedLearningContent => ({
    locale,
    sessions: [],
    terms: [],
  }));
  const problems: string[] = [];
  for (const [path, markdown] of Object.entries(value)) {
    const parsed = addFile(content, { path, markdown }, source);
    if (!parsed.ok) problems.push(parsed.failure);
  }
  if (problems.length > 0) return fail(problems.join("\n"));
  for (const translation of content) {
    const expected = Object.keys(sessionKinds).map(Number);
    const actual = translation.sessions
      .map((session) => session.session)
      .sort((first, second) => first - second);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(
        `${source} ${translation.locale} must have course sessions ${describeValue(expected)}, but its sessions are ${describeValue(actual)}.`,
      );
    }
    if (translation.terms.length === 0)
      problems.push(
        `${source} ${translation.locale} must have a glossary, but it has none.`,
      );
    problems.push(
      ...missingTermProblems(translation, `${source} ${translation.locale}`),
    );
    translation.sessions.sort(
      (first, second) => first.session - second.session,
    );
  }
  problems.push(...contentParityProblems(content, source));
  return problems.length > 0 ? fail(problems.join("\n")) : succeed(content);
}

function addFile(
  content: LocalizedLearningContent[],
  file: { path: string; markdown: unknown },
  source: string,
): Result<void, string> {
  const parts =
    /^\.\/content\/([^/]+)\/(glossary|session-([1-9][0-9]*))\.md$/u.exec(
      file.path,
    );
  const translation = content.find(
    (candidate) => candidate.locale === parts?.[1],
  );
  if (translation === undefined) {
    return fail(
      `${source} path must name a glossary or session Markdown file in one of ${describeValue(locales)}, but it is ${describeValue(file.path)}.`,
    );
  }
  const fileSource = `${source} file ${describeValue(file.path)}`;
  if (parts?.[2] === "glossary") {
    const glossary = parseGlossary(file.markdown, fileSource);
    if (!glossary.ok) return glossary;
    translation.terms = glossary.value;
  } else {
    const session = parseSessionContent(
      file.markdown,
      fileSource,
      Number(parts?.[3]),
    );
    if (!session.ok) return session;
    translation.sessions.push(session.value);
  }
  return succeed(undefined);
}

function missingTermProblems(
  content: LearningContent,
  source: string,
): string[] {
  const problems: string[] = [];
  const ids = new Set(content.terms.map((term) => term.id));
  for (const session of content.sessions) {
    for (const section of session.sections) {
      if (section.id !== "terms") continue;
      const missing = section.termIds.filter((id) => !ids.has(id));
      problems.push(
        ...missing.map(
          (id) =>
            `${source} session ${String(session.session)} must link to a glossary term, but ${describeValue(id)} is missing.`,
        ),
      );
    }
  }
  return problems;
}
