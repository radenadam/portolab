# 0009. One process serves pages and runs the price job

- Status: Accepted
- Date: 2026-10-31

## Context

During trading sessions, the server fetches prices every minute and fills the orders those prices reach. Portolab runs on one VPS, and its owner deploys it by following a guide.

## Decision

The Node process that serves pages also runs the price job, scheduled with croner. The job keeps its state in the database, so a restart resumes where it stopped.

## Alternatives

- **A separate worker process.** Isolates the job from page requests, at the cost of a second process to deploy and watch. It becomes worth it only if the job slows pages down.
- **An external scheduler such as cron.** One more moving part outside the app, with no benefit at this size.

## Consequences

- Deployment runs one container.
- A crash stops both pages and prices, and the container restarts both.
- The job must never block the event loop for long, so fetching is asynchronous and each fill runs as a short transaction.
