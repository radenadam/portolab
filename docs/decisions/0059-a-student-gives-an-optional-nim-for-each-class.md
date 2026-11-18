# 0059. A student gives an optional NIM for each class

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

### Client measurements

These measurements compare main at `a51f11c` with this change, using `pnpm build` and `pnpm size` and the dependency walk and gzip method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md). Both languages count. The new NIM field grows the route manifest on every page, even though the field itself loads only with joining and the account page.

| Dependency set   | JavaScript before, kB | JavaScript after, kB | CSS before, kB | CSS after, kB |
| ---------------- | --------------------: | -------------------: | -------------: | ------------: |
| Shared           |                141.94 |               141.97 |           7.76 |          7.76 |
| Account          |                148.50 |               149.54 |           8.03 |          8.03 |
| Account setup    |                148.11 |               148.28 |           7.88 |          7.88 |
| Join a class     |                149.38 |               150.20 |           7.88 |          7.88 |
| Privacy          |                145.52 |               145.67 |           7.88 |          7.88 |
| Students         |                184.46 |               184.50 |          17.89 |         17.89 |
| Student summary  |                205.91 |               206.03 |          21.70 |         21.73 |
| Student analysis |                205.07 |               205.19 |          19.81 |         19.84 |
| Student journal  |                197.21 |               197.33 |          19.32 |         19.35 |
| Ticket           |                223.20 |               223.23 |          23.64 |         23.64 |

Every other route grows by at most 0.03 kB of JavaScript. Every measured route fits the existing ceilings, including the [market map allowances](0056-the-market-map-has-measured-route-allowances.md), the [theme allowances](0057-theme-choice-has-measured-shared-and-route-allowances.md), and the [allowance of Beranda](0058-home-outcomes-have-a-measured-route-allowance.md). This change adds no allowance.

## Alternatives

- An account-wide NIM would force one institution's identifier onto every class.
- A required NIM would block a student whose class does not use one.
- Digits alone would reject institutional identifiers that include letters or separators. Unrestricted prose would accept text that cannot serve as a student identifier.
- A lecturer correction would make a student wait for someone else to correct their own data.

## Consequences

The migration leaves existing memberships without a NIM. Students can add one on the account page. Earlier workbooks can hold an older NIM, so the fixed username still identifies the account. No sign-in credential or session rule changes.
