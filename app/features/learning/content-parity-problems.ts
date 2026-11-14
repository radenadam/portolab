import { describeValue } from "../../value-shapes.ts";
import type {
  ContentBlock,
  LearningContent,
  LocalizedLearningContent,
  SessionContent,
} from "./content.ts";

export function contentParityProblems(
  content: readonly LocalizedLearningContent[],
  source: string,
): string[] {
  const problems: string[] = [];
  let reference: LocalizedLearningContent | undefined;
  for (const translation of content) {
    if (reference === undefined) reference = translation;
    else problems.push(...translationProblems(reference, translation, source));
  }
  return problems;
}

function translationProblems(
  first: LocalizedLearningContent,
  second: LocalizedLearningContent,
  source: string,
): string[] {
  const problems: string[] = [];
  const firstTerms = termLinks(first);
  const secondTerms = termLinks(second);
  if (JSON.stringify(firstTerms) !== JSON.stringify(secondTerms)) {
    problems.push(
      `${source} must have the same term ids and lesson links in every language, but ${first.locale} has ${describeValue(firstTerms)} and ${second.locale} has ${describeValue(secondTerms)}.`,
    );
  }
  for (const session of first.sessions) {
    const other = second.sessions.find(
      (candidate) => candidate.session === session.session,
    );
    if (
      other !== undefined &&
      JSON.stringify(sessionStructure(session)) !==
        JSON.stringify(sessionStructure(other))
    ) {
      problems.push(
        `${source} session ${String(session.session)} must have the same sections, term links, and references in every language, but ${first.locale} has ${describeValue(sessionStructure(session))} and ${second.locale} has ${describeValue(sessionStructure(other))}.`,
      );
    }
  }
  for (const term of first.terms) {
    const other = second.terms.find((candidate) => candidate.id === term.id);
    if (
      other !== undefined &&
      JSON.stringify(references(term.blocks)) !==
        JSON.stringify(references(other.blocks))
    ) {
      problems.push(
        `${source} term "${term.id}" must have the same formula and table references in every language, but ${first.locale} has ${describeValue(references(term.blocks))} and ${second.locale} has ${describeValue(references(other.blocks))}.`,
      );
    }
  }
  return problems;
}

function termLinks(content: LearningContent): string[] {
  return content.terms
    .map((term) => `${term.id}:${String(term.session)}`)
    .sort();
}

function sessionStructure(session: SessionContent): unknown[] {
  return session.sections.map((section) => {
    switch (section.id) {
      case "terms":
        return { id: section.id, termIds: section.termIds };
      case "interactive":
      case "practice":
        return { id: section.id };
      case "summary":
      case "key-idea":
      case "body":
      case "unavailable":
        return { id: section.id, references: references(section.blocks) };
    }
  });
}

function references(blocks: readonly ContentBlock[]): ContentBlock[] {
  return blocks.filter((block) => block.kind !== "paragraph");
}
