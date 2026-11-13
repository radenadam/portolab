# 0033. A student may write the reason of an order, which the lecturer reads

- Status: Accepted
- Date: 2026-11-14

## Context

A portfolio manager writes down why they trade, so that they can later judge the decision by its reason and not by its result alone. The approved design "Peta" gives the order ticket an optional field for this reason, keeps it in the activity of the student, and lets the lecturer read it, so that the lecturer follows how each student thinks between the meetings of the class. Portolab stores only what a class needs, as [the product brief](../product.md) asks, and the privacy notice tells each person what Portolab stores, who sees it, and how long Portolab keeps it.

## Decision

- The order form has the optional field "Alasan" ("Reason"). Its hint says that Portolab keeps the reason with the order and that the lecturer of the class can read it, so a student knows who reads it before writing it.
- A reason holds at most the characters that `reasonMaximumLength` in [`app/features/trading/reason-maximum-length.ts`](../../app/features/trading/reason-maximum-length.ts) sets, which is enough for a few sentences, and each list of orders shows it in full. Portolab keeps it without the spaces around it and with the line breaks of the student, so its paragraphs stay apart. A reason of only spaces is no reason.
- The reason is a column of the order. It lives as long as its order and is deleted with it, so a deletion of a student or of a class leaves no reason behind. The copy of the data of a person in [the deployment guide](../deploy.md#see-the-data-of-a-person) selects every column of the orders, so it holds the reasons.
- The student reads the reason with each order of the list of orders. The lecturer of the class reads the reasons of a student, each with its order, on the portfolio of the student. No other student reads them.
- A reason cannot be changed after the order is placed, because it records why the student traded at that moment, as every other record of the order does. So a correction of personal data covers the name alone, as [decision 0024](0024-a-person-changes-their-own-name-on-the-page-of-the-account.md) explains.

## Alternatives

- **A required reason.** A student who has no reason yet would write filler to send the order, which teaches nothing and fills the reading of the lecturer.
- **A journal of reasons in a table of its own.** A reason belongs to one order and lives as long as it, so a table of its own would need a second deletion and a second query of personal data without adding anything.
- **A reason that only the student reads.** The lecturer could not follow how each student decides, which is the point of the reason in the design.
- **A reason that the student can edit later.** The student could rewrite the reason after seeing how the trade went, so the reason would no longer show the thinking at the moment of the decision.

## Consequences

- The privacy notice says that Portolab stores the reason with the order and that the lecturer reads it.
- The order ticket of the design, the activity with its journal of reasons, and the pages of a student for the lecturer replace the order form and these lists, as issue #127 tracks, and they show the reason from this column.
