import type {
  ContentBlock,
  LearningContent,
  SessionContent,
} from "./content.ts";
import { describeValue } from "../../value-shapes.ts";

export function contentParityProblems(
  first: LearningContent,
  second: LearningContent,
  source: string,
): string[] {
  const problems: string[] = [];
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
        `${source} session ${String(session.session)} must have the same sections, term links, and references in both languages, but id has ${describeValue(sessionStructure(session))} and en has ${describeValue(sessionStructure(other))}.`,
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
        `${source} term "${term.id}" must have the same formula and table references in both languages, but id has ${describeValue(references(term.blocks))} and en has ${describeValue(references(other.blocks))}.`,
      );
    }
  }
  return problems;
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
