import type { Locale } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue, isRecord } from "../../value-shapes.ts";
import type { LearningContent } from "./content.ts";
import { sessionKinds } from "./content.ts";
import { contentParityProblems } from "./content-parity-problems.ts";
import { parseGlossary } from "./parse-glossary.ts";
import { parseSessionContent } from "./parse-session-content.ts";

export function parseLearningContent(
  value: unknown,
  source: string,
): Result<Record<Locale, LearningContent>, string> {
  if (!isRecord(value)) {
    return fail(
      `${source} must map content paths to Markdown, but it is ${describeValue(value)}.`,
    );
  }
  const content: Record<Locale, LearningContent> = {
    id: { sessions: [], terms: [] },
    en: { sessions: [], terms: [] },
  };
  const problems: string[] = [];
  for (const [path, markdown] of Object.entries(value)) {
    const parsed = addFile(content, path, markdown);
    if (!parsed.ok) problems.push(`${source}: ${parsed.failure}`);
  }
  if (problems.length > 0) return fail(problems.join("\n"));
  for (const [locale, translation] of Object.entries(content)) {
    const expected = Object.keys(sessionKinds).map(Number);
    const actual = translation.sessions
      .map((session) => session.session)
      .sort((first, second) => first - second);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      problems.push(
        `${source} ${locale} must have course sessions ${describeValue(expected)}, but its sessions are ${describeValue(actual)}.`,
      );
    }
    if (translation.terms.length === 0)
      problems.push(
        `${source} ${locale} must have a glossary, but it has none.`,
      );
    problems.push(...missingTermProblems(translation, `${source} ${locale}`));
    translation.sessions.sort(
      (first, second) => first.session - second.session,
    );
  }
  const firstTerms = content.id.terms
    .map((term) => `${term.id}:${String(term.session)}`)
    .sort();
  const secondTerms = content.en.terms
    .map((term) => `${term.id}:${String(term.session)}`)
    .sort();
  if (JSON.stringify(firstTerms) !== JSON.stringify(secondTerms)) {
    problems.push(
      `${source} must have the same term ids and lesson links in both languages, but id has ${describeValue(firstTerms)} and en has ${describeValue(secondTerms)}.`,
    );
  }
  problems.push(...contentParityProblems(content.id, content.en, source));
  if (problems.length > 0) return fail(problems.join("\n"));
  return succeed(content);
}

function addFile(
  content: Record<Locale, LearningContent>,
  path: string,
  markdown: unknown,
): Result<void, string> {
  const parts =
    /^\.\/content\/(id|en)\/(glossary|session-([1-9][0-9]*))\.md$/u.exec(path);
  const locale = parts?.[1];
  if (locale !== "id" && locale !== "en") {
    return fail(
      `${path} must be a glossary or session Markdown path in id or en, but it is ${describeValue(path)}.`,
    );
  }
  if (parts?.[2] === "glossary") {
    const glossary = parseGlossary(markdown, path);
    if (!glossary.ok) return glossary;
    content[locale].terms = glossary.value;
  } else {
    const session = parseSessionContent(markdown, path, Number(parts?.[3]));
    if (!session.ok) return session;
    content[locale].sessions.push(session.value);
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
