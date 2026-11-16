# 0052. The guide for lecturers lives in the repository and in the app

- Status: Accepted
- Date: 2026-11-16

## Context

A finance lecturer needs practical instructions for running a semester, including the limits of the simulation and help when a student cannot continue. The lecturer explores a sample class before teaching. The maintainer chose a guide in Bahasa Indonesia and English that follows the running version and can be read on a home network. An external document would require internet access and could describe another version.

## Decision

- Guide prose lives in per-language Markdown under `app/features/learning/guide/`. A lecturer opens Panduan from the profile menu at `/guide`, as [decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md) sets. A student receives a page that does not exist. A lecturer needs no class to read it.
- The guide reuses the title and section parser and the raw server imports of the [learning content mechanism](0036-lessons-and-the-glossary-are-content-in-both-languages.md). Its sections have stable ids and translated headings. Its boundary parser requires the same sections and ordered references in every language before it serves either one.
- Inline references take quoted labels from that language's messages and numbers from named constants through `Intl`. A link reference occupies a paragraph of its own and takes its address from a closed catalogue. Its standalone lesson link style keeps a full touch target without changing prose line spacing. The parser rejects links beside other content. Plain prose cannot contain handwritten quantities, quoted labels, or addresses. Tests check the rendered references, registered application routes, and linked deployment sections. Identifiers such as LQ45 remain text.
- The guide takes the centered reading column of a lesson, as [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) requires for reading pages without a reference screen. A contents control links to short sections and works before JavaScript loads. Its CSS belongs to its route, and it adds no chart or sheet enhancement to the frame.
- Privacy, deletion, backups, and server operations link to the privacy notice and deployment guide instead of copying them. Repository documentation links require internet access. The guide's own prose and labels ship in the build and work on a home network without that access.
- A change to what a lecturer sees or does updates both translations in the same pull request. The structural check cannot judge whether translations mean the same thing or whether a feature description is complete, so a reader checks both.

## Alternatives

- **Only a repository document.** It is easy to maintain, but requires internet access and a lecturer must find the version that matches the server.
- **An external document or content service.** It can be edited separately, but can drift from the app and adds another place to operate.
- **Every paragraph in Paraglide.** It would scatter the guide across message keys and duplicate its prose in tests, as decision 0036 explains for lessons.
- **Screenshots in the guide.** They need repeated capture as features change. Text and links cover this guide's steps without another copy of labels and figures.
- **Inline links with enlarged touch targets.** A link can wrap across lines or stand beside another link. An enlarged target can overlap a neighboring line or change its height. Standalone link paragraphs keep the normal prose lines and a full target.

## Consequences

The [content format](../learning-content.md#lecturer-guide) describes the guide references and their checks. The route loads its prose on the server and sends only the active translation. Changes to supported references update the parser and its tests together. The application bundles no external images or fonts for this page.

`pnpm build` and `pnpm size` on this change, based on main at `a952172`, give these gzip measurements. The route stays within the existing limits of decisions 0038 and 0042.

| Dependency set          | JavaScript, kB | CSS, kB |
| ----------------------- | -------------: | ------: |
| Shared before the guide |         139.71 |    7.51 |
| Shared with the guide   |         139.82 |    7.51 |
| Complete guide route    |         140.53 |    9.05 |
