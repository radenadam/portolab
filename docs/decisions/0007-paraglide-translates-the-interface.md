# 0007. Paraglide translates the interface

- Status: Accepted
- Date: 2026-10-31

## Context

Every screen and message must be complete in Bahasa Indonesia and in English. A missing or misspelled message should fail the build rather than reach a student.

## Decision

Portolab uses Paraglide JS 2. Messages live in one file per language, and Bahasa Indonesia is the default. Numbers, rupiah amounts, percentages, and dates are formatted through `Intl` for the active language.

## Alternatives

- **i18next.** Widely used, but typed keys need extra setup, and its runtime is larger.
- **FormatJS (react-intl).** Typed message IDs only through a global type override.
- **Lingui.** Small, but no typed keys were found.

## Consequences

- Each message is a typed function, so a wrong key is a compile error.
- Messages that no screen uses are removed from the bundle.
