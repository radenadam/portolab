# 0004. SQLite through Drizzle stores the data

- Status: Accepted
- Date: 2026-10-31

## Context

Portolab runs on one VPS for fewer than a hundred users. Writes concentrate in market hours, when orders, fills, and prices arrive. The server owner, not a database administrator, runs backups.

## Decision

Portolab stores its data in SQLite through `better-sqlite3` and Drizzle ORM, with write-ahead logging on. The schema is TypeScript with branded column types for units such as rupiah and shares. Migrations are generated as SQL and committed.

## Alternatives

- **PostgreSQL.** A second service to run, secure, and back up, for concurrency this app does not need.
- **Kysely.** A strong query builder, but the schema would live apart from the types.
- **Prisma 7.** A generated client and a required driver adapter, which add weight without adding safety here.

## Consequences

- The whole database is one file, and a backup is one command.
- SQLite allows one writer at a time, so every write is a short transaction.
- Moving to PostgreSQL later means changing the dialect and migrating the data.
