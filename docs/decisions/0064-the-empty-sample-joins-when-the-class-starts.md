# 0064. The empty sample joins when the class starts

- Status: Accepted
- Date: 2026-11-17

## Context

Piece 28 of #127 gives an empty portfolio its welcome, with the IHSG and unnamed classmates on its map. [Decision 0050](0050-a-sample-class-lives-in-a-database-of-its-own.md) gave the empty sample student the moment when the command ran as their joining time.

A quote update can retain a quote from an earlier day while stored history is newer. The recorded source reproduces this. The empty student then has no IHSG quote from their period, so the map correctly waits for one. That sample cannot show the approved welcome map even though the class has usable market data.

## Decision

The empty sample student joins at the class's stored creation time, which is the start of its sample calendar. The benchmark uses the real stored quote and closes from that period. The sample checks require the welcome's starting cash, no holdings or orders, and an available IHSG comparison.

## Alternatives

- Keep the command moment and wait for a quote from that period. The sample would show a recovery state until the source supplied it.
- Use the latest quote's day. The comparison's beginning would then change with the age of the source's quote rather than the sample calendar.

## Consequences

The welcome map can show the benchmark from the sample period when the latest quote is older than the command moment. The joining time uses an existing field, so it needs no new record. The ordinary joining flow still records the moment when a student joins a class.
