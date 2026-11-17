# 0057. A student gives an optional NIM for each class

- Status: Accepted
- Date: 2026-11-17

## Context

The second cut of [the rebuild](https://github.com/radenadam/portolab/issues/127) replaces the identifier below a student's name in Mahasiswa with the NIM drawn in the references of [decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md). A student can join classes that use different identifiers. An existing account or membership has no NIM.

## Decision

- A NIM is optional and belongs to a membership. Both a visitor creating an account and a signed-in student can give it when joining a class. Joining again never overwrites it.
- `parseStudentNim` in `app/features/classes/student-nim.ts` owns its length and form. It accepts ASCII letters, digits, dots, slashes, and hyphens. It trims surrounding whitespace and preserves leading zeroes and letter case. The length bound applies to the whole field as sent before trimming. An empty or omitted field stores null. NIMs need not be unique because Portolab does not verify an institution's numbering.
- Mahasiswa and its panel show the NIM under the name, in DM Mono, with the username as the fallback. Search accepts name, NIM, or username. The lecturer's student pages show the NIM under the name and keep the username in the activity line. The workbook adds a text column for NIM, which stays empty when none was given, and keeps the username column.
- A student corrects or removes each class's NIM on the account page, through the same field and parser. Only the signed-in student changes it, without a password or a new session, as with the name under [decision 0024](0024-a-person-changes-their-own-name-on-the-page-of-the-account.md). Lecturers cannot change it.
- The NIM is removed when the student clears it or the membership is deleted. The student, the class's lecturer, and the server owner can see it. Classmates never receive it. Personal-data exports include it and deletion removes it with the membership.
- The sample command gives every synthetic student a NIM prefixed with `CONTOH-`, so its identifiers are visibly fictional.

### Client measurements

These measurements compare main at `21dce2a` with this change, using `pnpm build` and `pnpm size` and the dependency walk and gzip method of [decision 0038](0038-client-javascript-is-budgeted-by-route.md). Both languages count. The new shared NIM field grows the route manifest on every page, even though the field itself loads only with joining and the account page.

| Dependency set   | JavaScript before, kB | JavaScript after, kB | CSS before, kB | CSS after, kB |
| ---------------- | --------------------: | -------------------: | -------------: | ------------: |
| Shared           |                140.16 |               140.18 |           7.50 |          7.50 |
| Account          |                146.45 |               147.46 |           7.78 |          7.78 |
| Join a class     |                147.33 |               148.15 |           7.62 |          7.62 |
| Privacy          |                143.50 |               143.64 |           7.62 |          7.62 |
| Students         |                182.69 |               182.73 |          17.63 |         17.63 |
| Student summary  |                204.04 |               204.10 |          21.33 |         21.35 |
| Student analysis |                203.00 |               203.06 |          19.51 |         19.53 |
| Student journal  |                194.86 |               194.92 |          18.76 |         18.78 |
| Ticket           |                221.28 |               221.31 |          23.16 |         23.16 |

The market map's [decision 0056](0056-the-market-map-has-measured-route-allowances.md) now provides the active ceilings for these dependency sets. NIM keeps those ceilings. The combined build is measured against main at `81ab185` before this change is pushed.

## Alternatives

- An account-wide NIM would force one institution's identifier onto every class.
- A required NIM would block a student whose class does not use one.
- Digits alone would reject institutional identifiers that include letters or separators. Unrestricted prose would accept text that cannot serve as a student identifier.
- A lecturer correction would make a student wait for someone else to correct their own data.

## Consequences

The migration leaves existing memberships without a NIM. Students can add one on the account page. Earlier workbooks can hold an older NIM, so the fixed username still identifies the account. No sign-in credential or session rule changes.
