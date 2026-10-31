# 0006. ESLint and Prettier check TypeScript 6

- Status: Accepted
- Date: 2026-10-31

## Context

The project wants the strictest checks that tools can enforce. TypeScript 7, the native compiler, shipped in July 2026 without a stable programmatic API, and typescript-eslint supports only TypeScript versions below 6.1.

## Decision

The code is TypeScript 6.0 with strict settings and extra strictness flags. ESLint 10 checks it with typescript-eslint's strict and stylistic type-checked presets and with rules for React hooks and accessibility. Prettier 3 formats it.

## Alternatives

- **Oxlint with Oxfmt on TypeScript 7.** Much faster, with 59 of typescript-eslint's 61 type-aware rules, but its formatter is in beta.
- **Biome 2.6.** One tool for both jobs, but some of its type-aware rules are still experimental.

## Consequences

- Checks run slower than native tools would, which is acceptable at this size.
- Moving to TypeScript 7 waits for typescript-eslint to support it, and gets its own decision.
