# 0017. The review panel reads each line once

- Status: Accepted. [Decision 0037](0037-merges-of-main-have-their-own-capped-review-rounds.md) changes how merge resolutions are selected, which rounds may review them after the ordinary cap, and how the caps interact.
- Date: 2026-11-03

## Context

The review panel ran a router agent, an agent for each lens that applied, and a verifier on every push, which was up to 9 agents on Claude Opus. Each of them read the whole diff of the pull request again. A later round re-reviewed code that an earlier round had passed and kept finding new small drift in it, and the defect protocol widened each fix into a sweep across the repository, which grew the diff for the next round. Pull requests took 13 to 29 rounds, and the panel used about a fifth of the maintainer's weekly usage in about a day, as issue #59 records. Most rounds found one or two things for all that usage, and usage that is spent out of proportion to what it produces is waste at any budget.

## Decision

- **One reviewer.** A script chooses the lenses from the paths of the changed files. One agent applies all of them in one session, and the verifier runs only when there is a finding to check. Both run on Claude Opus, each in a job of its own whose token can only read. A job without an agent rebuilds the round from the outputs of their jobs and posts the review.
- **Evidence.** The reviewer names each file under review that it read and says what it checked through each lens, and the round fails when one is missing. A reviewer on Sonnet once passed a diff of 195 KB after 9 seconds with an empty answer, which nothing told apart from a clean review.
- **Incremental rounds.** Each review records the head that it covered and the findings that stay open, in a marker that only the workflow's account can write. The next round reviews only the files that the commits of the pull request changed since that head, and the verifier checks whether each open finding is fixed. A push that changes no file under review runs no agent.
- **Scope.** A finding blocks the merge only when the change causes it or leaves it incomplete. The job opens an issue for the verified findings outside the change and for the candidate standards, and a pull request of their own handles them. The defect protocol sweeps every other instance in that pull request too.
- **Caps.** A round whose agent did not finish counts toward the limits of `scripts/review-plan.ts`. [Decision 0037](0037-merges-of-main-have-their-own-capped-review-rounds.md) governs the rounds after the ordinary review cap.
- **Measure.** Each review states the duration and the turns of each agent, which the job of the agent reads from its transcript. An agent could change them, as it can change every later step of its job, so they serve to compare rounds. A measure that cannot be read fails the round, like any output of a job that cannot be read.

## Alternatives

- **Keep an agent for each lens, but review only the new commits.** This removes the repeated reading, but each round still starts up to 9 agents, each of which reads AGENTS.md and the code around the change.
- **Run the agents on Claude Sonnet.** Tried on #65 and #66. The reviewer answered after 9 to 21 seconds, saw only the start of each long diff, and never opened the lens definitions, while a separate review of #65 found 14 defects in it. The saving of this decision comes from one agent and from incremental rounds, so the agents keep the model that reads the whole change.
- **Review only once, on the first push.** The cheapest choice, but a fix could then introduce a defect that nobody reads.
- **Drop the agents and keep only `pnpm check`.** Most standards in AGENTS.md need a reader, so the gate would no longer check them.

## Consequences

- A round after the first reads a diff about the size of the fix, so it costs a fraction of a first round.
- A finding that a lens would have reported on old code in a later round no longer appears, because no later round reads old code.
- [Decision 0037](0037-merges-of-main-have-their-own-capped-review-rounds.md) governs what an author may push after the ordinary review rounds.
- A sweep that a new standard needs lands in its own pull request, so `main` can hold old instances for a short time, and its issue names them.
