# 0017. The review panel reads each line once

- Status: Accepted
- Date: 2026-11-03

## Context

The review panel ran a router agent, an agent for each lens that applied, and a verifier on every push, which was up to 9 agents on Claude Opus. Each of them read the whole diff of the pull request again. A later round re-reviewed code that an earlier round had passed and kept finding new small drift in it, and the defect protocol widened each fix into a sweep across the repository, which grew the diff for the next round. Pull requests took 13 to 29 rounds, and the panel used about a fifth of the maintainer's weekly usage in about a day. That usage is shared with other projects, so the cost of the process is a constraint, as issue #59 records.

## Decision

- **One job, one reviewer.** A script chooses the lenses from the paths of the changed files. One agent applies all of them in one session, and the verifier runs only when there is a finding to check. Both run on Claude Sonnet.
- **Incremental rounds.** Each review records the head that it covered and the findings that stay open, in a marker that only the workflow's account can write. The next round reviews only what changed since that head, and the verifier checks whether each open finding is fixed. A push that changes no file of the pull request and leaves no finding open runs no agent.
- **Scope.** A finding blocks the merge only when the change causes it or leaves it incomplete. The job opens an issue for the verified findings outside the change and for the candidate standards, and a pull request of their own handles them. The defect protocol sweeps every other instance in that pull request too.
- **Caps.** After the review rounds that `scripts/review-plan.ts` allows, a round only checks the open findings. After the rounds that check, the job fails without an agent, and the pull request goes to a maintainer.
- **Measure.** Each review states the minutes and the turns of each agent, from the transcript of the agent.

## Alternatives

- **Keep an agent for each lens, but review only the new commits.** This removes the repeated reading, but each round still starts up to 9 agents, each of which reads AGENTS.md and the code around the change.
- **Keep Opus for the verifier.** The verifier decides what blocks, so a stronger model would refute more false findings. It runs only when there are findings, and the measure in each review shows whether Sonnet confirms findings that a later round has to reverse.
- **Review only once, on the first push.** The cheapest choice, but a fix could then introduce a defect that nobody reads.
- **Drop the agents and keep only `pnpm check`.** Most standards in AGENTS.md need a reader, so the gate would no longer check them.

## Consequences

- A round after the first reads a diff about the size of the fix, so it costs a fraction of a first round.
- A finding that a lens would have reported on old code in a later round no longer appears, because no later round reads old code.
- A push after the review rounds goes unreviewed by an agent. So after the cap, an author pushes only fixes of open findings and merges of `main`, as AGENTS.md says.
- A sweep that a new standard needs lands in its own pull request, so `main` can hold old instances for a short time, and its issue names them.
