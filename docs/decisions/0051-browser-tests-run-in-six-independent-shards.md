# 0051. Browser tests run in six independent shards

- Status: Accepted
- Date: 2026-11-16

## Context

The Check workflow ran `pnpm check` in one job. Each piece of the rebuild adds browser cases, and [issue #269](https://github.com/radenadam/portolab/issues/269) records complete runs and runs that exhausted the whole-check deadline. Raising that deadline keeps every pull request waiting on the entire suite on one runner. [Issue #275](https://github.com/radenadam/portolab/issues/275) separately tracks snapshot cases that put too much work within one case deadline. Sharding does not change a case's work or deadline.

## Measurements

These measurements come from the Check logs and the job and step timestamps returned by `gh run view <id> --json jobs`. Browser durations come from Playwright's summary, so they exclude installation and the fast check.

| Run                                                                           | Head      | Cases | Browser phase |       Whole check job |
| ----------------------------------------------------------------------------- | --------- | ----: | ------------: | --------------------: |
| [43760746237](https://github.com/radenadam/portolab/actions/runs/43760746237) | `1a0ccf5` |   564 |  28.2 minutes | 31 minutes 52 seconds |
| [43805077482](https://github.com/radenadam/portolab/actions/runs/43805077482) | `3fcac94` |   682 |  35.4 minutes | 38 minutes 53 seconds |
| [43816264127](https://github.com/radenadam/portolab/actions/runs/43816264127) | `a952172` |   688 |  41.7 minutes |  46 minutes 3 seconds |

The latest passing main run is the last row. Its browser phase used four workers and finished with 675 passes and 13 skips. The whole-check step took 45 minutes 33 seconds. The fast phase before the browser cases took about 3 minutes 54 seconds within that step. These are observations of different heads and runners, so their difference does not isolate a cause of slower cases.

Dividing the latest browser duration by four already projects 10.4 minutes per shard before uneven work. To compare larger counts, list the suite with `pnpm exec playwright test --list --shard=i/n --reporter=json`. Match each case by project, file, line, and full title to the 675 passing case durations in the main log. Sum each shard's case durations and divide by its four workers. Skipped cases contribute no duration. These estimates exclude startup and assume the same case timings and continuous worker use.

| Shards | Cases per shard              | Projected minutes by shard               | Longest projection |
| -----: | ---------------------------- | ---------------------------------------- | -----------------: |
|      5 | 138, 138, 138, 137, 137      | 5.80, 11.83, 8.81, 5.36, 9.57            |              11.83 |
|      6 | 115, 115, 115, 115, 114, 114 | 5.14, 7.93, 8.62, 4.90, 7.05, 7.73       |               8.62 |
|      7 | 99, 99, 98, 98, 98, 98, 98   | 5.13, 5.21, 8.73, 5.69, 2.82, 7.61, 6.18 |               8.73 |

With the initial four-worker profile, six is the smallest measured count whose longest projection stays below the target of about ten minutes. Its longest shard leaves about 16 percent growth before ten minutes. Seven repeats setup on another runner without lowering the longest projection. Playwright balances case counts rather than observed durations, so CI must also measure each shard. The six lists together contain every one of the suite's 688 cases once.

### The first sharded runs

[Run 43873909579](https://github.com/radenadam/portolab/actions/runs/43873909579/attempts/1) ran the six shards with four case workers on each runner. The fast job passed in 311 seconds. The browser steps took 412, 616, 515, 255, 447, and 569 seconds. Shard 1 completed its 115 cases with 109 passes, two skips, and four failures at the existing 60-second case deadline. The other five shards passed. The gate named browser-1 and failed, and its traces and HTML report remained downloadable.

An [unchanged rerun of the failed jobs](https://github.com/radenadam/portolab/actions/runs/43873909579/attempts/2) reused the five passing shards and the fast result. Shard 1 again completed in 6.8 minutes with four cases at their own deadline. The first attempt lost the English native activity journey, the Indonesian demonstration summary, and both demonstration trading journeys. The rerun lost both demonstration summaries and both trading journeys. These are case deadlines within a completed shard, rather than the whole-check deadline that sharding removes.

The original choice copied the monolithic worker pool and sized only the total work. It did not leave the long cases enough margin for the variation that issue #269 already measured. Case workers share CPU with the server and Chromium, so the new default uses half the CPUs. The measured runners have four CPUs, which gives two case workers. The reliability lens now checks each unit's deadline as well as the whole job when parallelism changes. This changes the pool in CI and keeps the existing local default and slot settings.

## Decision

Run `pnpm check:fast` in its own job and split the browser suite into six independent jobs with Playwright's `--shard=i/6`. Use half the CPUs for case workers unless a check slot selects a smaller pool. Keep the assertions, case deadlines, and zero retries. The existing `fullyParallel` setting allows [Playwright to shard individual tests](https://playwright.dev/docs/test-sharding#balancing-shards).

Each browser job installs through the existing cached `pnpm/setup` action, installs Chromium through the existing browser action, builds once, and runs only its shard. The fast job installs once and runs its existing build and size check without installing Chromium. The gate checks out the code and runs a Node script that needs no package installation or build. Local `pnpm check` still runs the fast check and complete browser suite in sequence.

Use explicit job ids so `needs` gives the gate a separate result for every shard. The browser jobs reuse their steps through [YAML anchors supported by GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#yaml-anchors-and-aliases). The required job keeps the name `check`, uses `always()`, and waits for the fast job and all six browser jobs. It fails for every result other than `success`, including a missing result, cancellation, or skip. Its tests compare the expected jobs with the workflow and exercise all unsuccessful results and malformed inputs through the gate code.

Every job and step keeps a time limit. Browser execution has a 20-minute step limit within a 35-minute job, which leaves room beyond the projected duration and time to upload evidence after a step timeout. Each failed shard uploads `test-results/` and `playwright-report/` under a unique artifact name for seven days. There is no sibling cancellation on a shard failure, so the other shards finish their coverage and retain their own evidence.

## Alternatives

- **Keep one browser runner and raise its limit.** The observed complete runs already take tens of minutes, and the growing suite keeps increasing that wait.
- **Use four or five shards.** The latest measurements project more than the ten-minute target before growth.
- **Use seven shards.** The case-level projection leaves its longest shard slower than the longest of six, so the extra setup has no measured benefit.
- **Keep one case worker per CPU.** The two sharded runs still exhausted individual case deadlines even though the shards finished. A smaller pool leaves CPU for the server and browser processes without enlarging those deadlines.
- **Use a matrix and judge its aggregate result.** A matrix gives `needs` one result for the matrix job, which cannot name every unsuccessful shard. Collecting per-shard artifacts or querying the jobs API would add another failure path to the gate.
- **Build in a separate job and transfer the build.** A build is short compared with the browser suite. Transferring its generated server and client files would add an artifact dependency and download on every shard. Each shard instead builds once, without repeating the fast checks.

## Consequences

The slowest browser shard sets the Check workflow's wait once the fast job finishes. Each shard has its own server and temporary database, which reduces concurrent work on any one server without changing the tests. Additional runners repeat setup and builds, so total runner time can grow even while wall time falls. A case that exhausts its own deadline still fails and needs a separate correction.

The change adds no client JavaScript or CSS and changes no route budget. Main's first complete sharded run provides the comparison against the measured main run above, including every shard's browser and job duration.
