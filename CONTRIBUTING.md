# Contributing

Coding agents make most changes to Portolab, and every change follows the same workflow, whoever makes it. The standards live in [`AGENTS.md`](AGENTS.md), so this file covers only the steps.

1. Install [pnpm](https://pnpm.io) 12, then run `pnpm install`. This also installs git hooks that format and lint your staged files and check your commit message.
2. Follow the section "Workflow" of [`AGENTS.md`](AGENTS.md#workflow), which covers the branch, the change, `pnpm check`, and the pull request. The section "Review panel" describes the automated review that CI adds.

To report a bug or suggest an idea, open an issue. To report a vulnerability, follow [`SECURITY.md`](SECURITY.md).

After `pnpm build`, `pnpm size` reports the shared JavaScript, every route, the whole client, and CSS. [Decision 0038](docs/decisions/0038-client-javascript-is-budgeted-by-route.md) explains the budgets, their measurements, and how to keep an enhancement with its route.

## Decision records

Add a record in `docs/decisions/` with the next unused number in its filename and heading. Before pushing, merge `origin/main` into the branch and run `pnpm check`, which rejects duplicate decision numbers. If another pull request has taken the number, renumber the record that your pull request adds and update its heading, links, and mentions. Keep the number of the record already on main.
