# 0060. A student gives an optional NIM for each class

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

These measurements compare main at `5a209f4` with this change, using `pnpm build` and `pnpm size` and the dependency walk and gzip method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md). Both languages count. The new NIM field grows the route manifest on every page, even though the field itself loads only with joining and the account page.

| Dependency set   | JavaScript before, kB | JavaScript after, kB | CSS before, kB | CSS after, kB |
| ---------------- | --------------------: | -------------------: | -------------: | ------------: |
| Shared           |                141.94 |               141.97 |           7.79 |          7.79 |
| Account          |                148.50 |               149.54 |           8.06 |          8.06 |
| Account setup    |                148.11 |               148.28 |           7.91 |          7.91 |
| Join a class     |                149.38 |               150.20 |           7.91 |          7.91 |
| Privacy          |                145.52 |               145.67 |           7.91 |          7.91 |
| Students         |                184.46 |               184.50 |          17.92 |         17.92 |
| Student summary  |                206.09 |               206.21 |          21.80 |         21.82 |
| Student analysis |                205.07 |               205.19 |          19.84 |         19.87 |
| Student journal  |                197.38 |               197.50 |          19.42 |         19.45 |
| Ticket           |                223.38 |               223.41 |          23.74 |         23.74 |

Every other route grows by at most 0.03 kB of JavaScript. Every measured route fits the existing ceilings, including the [market map allowances](0056-the-market-map-has-measured-route-allowances.md), the [theme allowances](0057-theme-choice-has-measured-shared-and-route-allowances.md), the [allowance of Beranda](0058-home-outcomes-have-a-measured-route-allowance.md), and the [ceiling of Pasar](0059-the-owner-supplies-company-logos-outside-the-repository.md). This change adds no allowance.

## Alternatives

- An account-wide NIM would force one institution's identifier onto every class.
- A required NIM would block a student whose class does not use one.
- Digits alone would reject institutional identifiers that include letters or separators. Unrestricted prose would accept text that cannot serve as a student identifier.
- A lecturer correction would make a student wait for someone else to correct their own data.

## Consequences

The migration leaves existing memberships without a NIM. Students can add one on the account page. Earlier workbooks can hold an older NIM, so the fixed username still identifies the account. No sign-in credential or session rule changes.
