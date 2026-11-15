# 0045. The lecturer trades in a demonstration portfolio

- Status: Accepted
- Date: 2026-11-15

## Context

[Decision 0028](0028-every-screen-follows-the-reference-screens-of-peta.md) gives the lecturer a portfolio for teaching in front of the class. Students must not see it, and no class statistic may count it. The existing store identifies every portfolio, holding, and order by a student membership, so it cannot represent that owner without making the lecturer part of the student roster.

## Decision

- A portfolio has its own id. Its owner is a union of a student membership and the demonstration of a class. The database requires exactly one owner and allows at most one portfolio for each membership and each class demonstration.
- Holdings, orders, fills, cancellations, and the price job use the portfolio id. Student statistics start with the student roster and resolve only membership owners, so the demonstration never enters their input.
- The lecturer of a class trades in its demonstration through the same stock page and ticket as a student. Portofolio opens Ringkasan, Aktivitas, and Analisis at the addresses of [decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md). Every demonstration loader and action checks that the reader teaches that class. Other people receive a 404.
- The demonstration starts with the starting cash of the class, and its return counts from when the class was created, so cash before the first trade counts as it does for a student after joining. Like a student's portfolio, it needs no stored row until its first accepted order. The summary includes anonymous student points for comparison, while no student map includes the demonstration.
- Deleting a membership deletes its student portfolio. Deleting a class deletes its demonstration as well as its students' work. The privacy notice and the personal data export include the lecturer's simulated work.
- The migration copies existing cash, holdings, orders, ids, and reasons into rebuilt tables. It keeps the order counter so a deleted order's number is never reused. Existing membership numbers become the ids of their migrated portfolios, and later portfolio ids are independent of membership numbers. The server owner backs up before updating, as [the deployment guide](../deploy.md#update-portolab) requires.

## Alternatives

- A demonstration kind of membership would put the portfolio in the roster and require every reader of class statistics to remember a filter.
- A hidden student account would store a fictitious person and require the same filters, along with credentials and account deletion rules.
- Separate trading tables for the lecturer would duplicate fills, order checks, and reporting.

## Consequences

The lecturer uses the established trading rules and the same views. The migration test upgrades a copy of a populated database and checks preservation and cascading deletion with foreign keys enabled. Each implemented reader of class statistics has an exclusion test for a measured demonstration.
