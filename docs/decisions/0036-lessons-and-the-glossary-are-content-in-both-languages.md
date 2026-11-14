# 0036. Lessons and the glossary are content in both languages

- Status: Accepted
- Date: 2026-11-14

## Context

The Peta rebuild teaches the topics of the course in Bahasa Indonesia and English. The short lessons, full lessons, and glossary contain prose that a lecturer can review as a whole. Keeping every sentence in Paraglide would scatter that prose across message keys and repeat it in message tests. The maintainer chose original text for this course and per-language Markdown in issue #127.

## Decision

- Lesson and glossary prose lives in Markdown files for each language inside the learning feature. The [content format](../learning-content.md) defines the supported Markdown and its typed references.
- Lesson depth follows the [catalogue of the approved Peta prototype](https://github.com/radenadam/portolab/blob/design/peta-prototype/src/concepts.js). The [`sessionKinds` table and `cannotPractiseSession`](../../app/features/learning/content.ts) are the named policy for each session's format and for the instruments that the simulator cannot practise. [Decision 0032](0032-a-class-meets-weekly-from-the-date-of-its-first-session.md) owns the course topics and the roles of research reviews and exams.
- A boundary parser validates every file before a page receives its typed sessions and terms. It checks the course session set, section structure, term links, and known formula and table references. It checks that both languages agree on those structures. `pnpm check` applies the parser to all shipped content and tests its refusal of malformed or mismatched content.
- Sentences computed from data remain Paraglide messages. Interface controls and errors remain messages too. Content Markdown holds original prose and references to formulas and tables rather than copies of figures owned by code or dated rules.
- Vite bundles the raw Markdown into the server module. Reading content never resolves a path against the working directory.
- Review sessions and exams are cards with a summary. Full lessons reserve named sections for interactives and practice, which later pieces implement. A reserved section holds no promise that its activity already exists.

## Alternatives

- **All prose in Paraglide.** Typed keys would cover it, but a reviewer would have to reconstruct a lesson from sentence keys and their tests.
- **A content service or database.** It would let a lecturer edit prose independently, but it would add deployment and versioning work. Repository content ships with the version whose rules it explains.
- **General Markdown with embedded code.** It would allow arbitrary layouts and calculations, but calculations could drift from the app and content could bypass its components. A small supported format gives typed references to the existing notation and rule data.

## Consequences

The structural check cannot establish translation equivalence or financial accuracy. A reader still reviews both. Adding a lesson section or a reference changes its parser and tests in the same change. Pages render paragraphs as text and handle reference kinds explicitly. Pieces 22, 23, and 30 of issue #127 connect the content to pages and practice.
