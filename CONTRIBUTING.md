# Contributing

Coding agents make most changes to Portolab, and every change follows the same workflow, whoever makes it. The standards live in [`AGENTS.md`](AGENTS.md), so this file covers only the steps.

1. Install [pnpm](https://pnpm.io) 12, then run `pnpm install`. This also installs git hooks that format and lint your staged files and check your commit message.
2. Create a branch from `main`.
3. Make the whole change, including its tests and every document it affects.
4. Run `pnpm check`. It runs everything that CI runs, and it must pass.
5. Open a pull request. Its title follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), for example `feat(orders): reject orders that exceed available cash`. Its description explains why the change is needed.

CI runs the same checks and an automated review. A pull request merges when both pass.

To report a bug or suggest an idea, open an issue. To report a vulnerability, follow [`SECURITY.md`](SECURITY.md).
