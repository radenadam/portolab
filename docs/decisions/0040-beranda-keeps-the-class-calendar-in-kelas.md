# 0040. Beranda keeps the class calendar in Kelas

- Status: Accepted
- Date: 2026-11-14

## Context

[Decision 0032](0032-a-class-meets-weekly-from-the-date-of-its-first-session.md) puts the current session and a missing calendar notice on the class page. [Decision 0030](0030-each-class-is-one-workspace-with-its-own-addresses.md) makes the student class root Beranda. Its [approved reference](../design/peta/home-desktop-light.png) opens with portfolio value, return, and risk, and it has no class calendar notice.

## Decision

Beranda follows its portfolio reference. The lecturer's Kelas page keeps the semester, the current session, and the notice that asks the lecturer to set a missing first session date. Its calendar page keeps the form for that date. Beranda shows none of these calendar notices.

## Alternatives

Keeping the calendar notice on Beranda would preserve the former class page, but it would add a separate subject above the portfolio summary of the approved screen.

## Consequences

The lecturer still opens the class calendar from Kelas. Beranda opens with the student's portfolio even when the lecturer has not set the first session date. This changes only where the calendar information appears, so the weekly schedule and the limits of the date remain those of decision 0032.
