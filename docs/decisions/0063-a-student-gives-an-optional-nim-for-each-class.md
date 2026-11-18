# 0063. A student gives an optional NIM for each class

- Status: Accepted
- Date: 2026-11-17

## Context

The second cut of [the rebuild](https://github.com/radenadam/portolab/issues/127) replaces the identifier below a student's name in Mahasiswa with the NIM drawn in the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). A student can join classes that use different identifiers. An existing account or membership has no NIM.

## Decision

- A NIM is optional and belongs to a membership. Both a visitor creating an account and a signed-in student can give it when joining a class. Joining again never overwrites it.
- `parseStudentNim` in `app/features/classes/student-nim.ts` owns its length and form. It accepts ASCII letters, digits, dots, slashes, and hyphens. It trims the spaces around the NIM before it counts the length, as the rules of names and usernames do, so its error counts the characters that the reader sees. It preserves leading zeroes and letter case. An empty or omitted field stores null. NIMs need not be unique because Portolab does not verify an institution's numbering.
- Mahasiswa and its panel show the NIM under the name, in DM Mono, with the username as the fallback. Search accepts name, NIM, or username. The lecturer's student pages show the NIM in the line under the name, before the latest order, as the reference does, with the username as the fallback. The workbook adds a text column for NIM, which stays empty when none was given, and keeps the username column.
- A student corrects or removes each class's NIM on the account page, through the same field and parser. Only the signed-in student changes it, without a password or a new session, as with the name under [decision 0024](0024-a-person-changes-their-own-name-on-the-page-of-the-account.md). Lecturers cannot change it.
- The NIM is removed when the student clears it or the membership is deleted. The student, the class's lecturer, and the server owner can see it. Classmates never receive it. Personal-data exports include it and deletion removes it with the membership.
- The sample command gives every synthetic student a NIM prefixed with `CONTOH-`, so its identifiers are visibly fictional.
- The JavaScript ceilings in the table below replace those of [decision 0060](0060-learning-practices-have-measured-sheet-allowances.md) for the named dependency sets. They leave a margin of about 0.2 kB, as decisions 0060 and 0061 do. Every other ceiling and the complete dependency walk keep their rules.

| Dependency set             | JavaScript ceiling, kB gzip |
| -------------------------- | --------------------------: |
| Demonstration Activity     |                       212.1 |
| Class ranking              |                       206.5 |
| Lecturer's student summary |                       225.3 |
| Lecturer's student journal |                       212.5 |

### Client measurements

These measurements compare main at `d8bc523` with this change merged with that main, on the same machine, using `pnpm build` and `pnpm size` and the complete dependency walk and gzip method of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes. Both languages count.

| Dependency set              | Main, JavaScript/CSS kB | This change, JavaScript/CSS kB |
| --------------------------- | ----------------------: | -----------------------------: |
| Shared code                 |           142.65 / 7.90 |                  142.68 / 7.90 |
| Account                     |           149.20 / 8.17 |                  150.25 / 8.17 |
| Account setup               |           148.82 / 8.02 |                  148.99 / 8.02 |
| Join a class                |           150.08 / 8.02 |                  150.91 / 8.02 |
| Privacy                     |           146.23 / 8.02 |                  146.39 / 8.02 |
| Demonstration Activity      |          211.90 / 20.82 |                 211.93 / 20.82 |
| Class ranking               |          206.26 / 20.26 |                 206.31 / 20.26 |
| Lecturer's student summary  |          224.94 / 23.59 |                 225.06 / 23.62 |
| Lecturer's student analysis |          230.58 / 22.99 |                 230.71 / 23.02 |
| Lecturer's student journal  |          212.19 / 21.21 |                 212.31 / 21.24 |

The field of the NIM loads only with joining and the account page. But the route manifest that every route shares names the new modules, so every other route grows by at most 0.03 kB of JavaScript. The line of the NIM on the pages of a student adds about 0.1 kB to each of them. Demonstration Activity, the class ranking, the lecturer's student summary, and the lecturer's student journal sat within 0.06 kB of their ceilings, so this change puts them over. Every other route stays within its ceiling.

## Alternatives

- An account-wide NIM would force one institution's identifier onto every class.
- A required NIM would block a student whose class does not use one.
- Digits alone would reject institutional identifiers that include letters or separators. Unrestricted prose would accept text that cannot serve as a student identifier.
- A lecturer correction would make a student wait for someone else to correct their own data.
- Keeping the ceilings of decision 0060 would leave four routes without room for the shared manifest, which grows with every new module of any route.

## Consequences

The migration leaves existing memberships without a NIM. Students can add one on the account page. Earlier workbooks can hold an older NIM, so the fixed username still identifies the account. No sign-in credential or session rule changes. `scripts/client-route-limits.ts` holds the four ceilings, and `scripts/client-size.test.ts` checks them on their routes.
