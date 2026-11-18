# 0064. A student gives an optional NIM for each class

- Status: Accepted
- Date: 2026-11-17

## Context

The second cut of [the rebuild](https://github.com/radenadam/portolab/issues/127) replaces the identifier below a student's name in Mahasiswa with the NIM drawn in the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). A student can join classes that use different identifiers. An existing account or membership has no NIM.

## Decision

- A NIM is optional and belongs to a membership. Both a visitor creating an account and a signed-in student can give it when joining a class. Joining again never overwrites it.
- `parseStudentNim` in `app/features/classes/student-nim.ts` owns its length and form. It accepts ASCII letters, digits, dots, slashes, and hyphens. It trims the spaces around the NIM before it counts the length, as the rules of names and usernames do, so its error counts the characters that the reader sees. It preserves leading zeroes and letter case. An empty or omitted field stores null. NIMs need not be unique because Portolab does not verify an institution's numbering.
- Mahasiswa and its panel show the NIM under the name, in DM Mono, with the username as the fallback. Search accepts name, NIM, or username, and its label names all three. The reference names only the name and the NIM, but a class whose students gave no NIM shows usernames, so that label would state a narrower rule than the search applies. The lecturer's student pages show the NIM in the line under the name, before the latest order, as the reference does, with the username as the fallback. The workbook adds a text column for NIM, which stays empty when none was given, and keeps the username column.
- A student corrects or removes each class's NIM on the account page, through the same field and parser. Only the signed-in student changes it, without a password or a new session, as with the name under [decision 0024](0024-a-person-changes-their-own-name-on-the-page-of-the-account.md). Lecturers cannot change it, so a lecturer who sends the form gets a refusal with status 403 on the page of the account. A form for a class that the student is no longer in loads that page again with the classes that remain.
- The NIM is removed when the student clears it or the membership is deleted. The student, the class's lecturer, and the server owner can see it. Classmates never receive it. Personal-data exports include it and deletion removes it with the membership.
- The sample command gives every synthetic student a NIM prefixed with `CONTOH-`, so its identifiers are visibly fictional.

### Client measurements

These measurements compare main at `7859fec` with this change merged with that main, on the same machine, using `pnpm build` and `pnpm size` and the complete dependency walk and gzip method of decisions [0038](0038-client-javascript-is-budgeted-by-route.md) and [0042](0042-client-css-is-budgeted-by-route.md). kB means 1,000 bytes. Both languages count.

| Dependency set              | Main, JavaScript/CSS kB | This change, JavaScript/CSS kB |
| --------------------------- | ----------------------: | -----------------------------: |
| Shared code                 |           142.78 / 7.90 |                  142.81 / 7.90 |
| Account                     |           149.55 / 8.17 |                  150.59 / 8.17 |
| Account setup               |           149.17 / 8.02 |                  149.33 / 8.02 |
| Join a class                |           150.43 / 8.02 |                  151.25 / 8.02 |
| Privacy                     |           146.58 / 8.02 |                  146.73 / 8.02 |
| Class ranking               |          206.40 / 20.26 |                 206.44 / 20.26 |
| Lecturer's student summary  |          225.13 / 23.65 |                 225.25 / 23.68 |
| Lecturer's student analysis |          230.78 / 23.05 |                 230.89 / 23.08 |
| Lecturer's student journal  |          212.33 / 21.21 |                 212.44 / 21.24 |

The field of the NIM loads only with joining and the account page. But the route manifest that every route shares names the new modules, so every other route grows by at most 0.03 kB of JavaScript. The line of the NIM on the pages of a student adds about 0.1 kB to each of them. Every route fits its ceiling, so this change adds no allowance. The lecturer's student analysis keeps 0.01 kB below its ceiling of [decision 0061](0061-analysis-panels-have-measured-route-allowances.md).

## Alternatives

- An account-wide NIM would force one institution's identifier onto every class.
- A required NIM would block a student whose class does not use one.
- Digits alone would reject institutional identifiers that include letters or separators. Unrestricted prose would accept text that cannot serve as a student identifier.
- A lecturer correction would make a student wait for someone else to correct their own data.

## Consequences

The migration leaves existing memberships without a NIM. Students can add one on the account page. Earlier workbooks can hold an older NIM, so the fixed username still identifies the account. No sign-in credential or session rule changes.
