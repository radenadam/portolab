# 0024. A person changes their own name on the page of the account

- Status: Accepted
- Date: 2026-11-11

## Context

The privacy notice tells each person that the law on personal data protection of Indonesia gives them the right to correct their data, and issue #99 asks for a way to correct a name. The name is the one record that describes the person outside Portolab, so it is the one that can be wrong. Every other record holds what happened in Portolab, such as the orders, the role, and the time of the agreement, or the username that names the account. Every name follows one rule, which the parser of the name field applies when a student joins a class and when a lecturer finishes the account. A name that someone writes into the database by hand would skip that rule.

The lecturer of a class sees the name of each student beside the work, and the workbook for grading holds it. The username, which never changes, stands beside the name on the page of the class and in the workbook, so it tells the lecturer whose work it is.

The server often belongs to the lecturer, as decision 0010 explains, so a request to the person who runs the server often means that the lecturer connects to the server through SSH.

## Decision

- The page of the account has a form that changes the name, with the same field and the same rule as the forms where a person first gives the name. The field starts with the stored name and says who sees the name, which depends on the role.
- Only the person who is signed in changes their own name. The form asks for no password, unlike the form of the password, because a name signs nobody in and the person can change it back. A change of the name keeps every session, and the check of origins of decision 0005 refuses the form when another site sends it, as it refuses every form.
- The account command has no action that changes a name, and a lecturer does not change the name of a student.
- `docs/deploy.md` shows the person who runs the server how to give a person a copy of all their data, sends a request to correct the name to the page of the account, and deletes the data of a person who withdraws their agreement.

## Alternatives

- **An action of the account command.** The person who runs the server would connect to the server for each mistyped name. The command writes for the person who runs the server in English, so it would state the rule of names a second time, apart from the messages in the language of the reader.
- **The form and an action of the command.** The action would serve no request that the form does not serve, because every person can sign in, if need be with a temporary password from the lecturer or from the person who runs the server.
- **The lecturer changes the names of the students.** The lecturer would decide how each student appears, but a student would wait for the lecturer to correct their own name, and a lecturer would still need another way to correct their own.

## Consequences

- A student can change their name at any time, so a workbook that the lecturer downloaded earlier may hold an older name. The username stays the same and tells the lecturer whose work it is.
- Portolab offers no correction of any other record, such as the username.
