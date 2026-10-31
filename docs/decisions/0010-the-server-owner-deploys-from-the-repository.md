# 0010. The server owner deploys from the repository

- Status: Accepted
- Date: 2026-10-31

## Context

The VPS belongs to the lecturer, who deploys Portolab with the help of a coding agent. The maintainers have no access to the server, and CI should hold no credentials for it. Demonstrations also run on a Windows laptop for phones on the same Wi-Fi network.

## Decision

- Docker Compose runs the app container, built on the server from the repository.
- Caddy on the host serves HTTPS for the VPS hostname and forwards requests to the app.
- `docs/deploy.md` covers installation, configuration, HTTPS, backups, and updates, step by step from a fresh Ubuntu server.
- An update is a pull from the repository and a rebuild, run outside trading sessions.
- CI never deploys.

## Alternatives

- **CI deploys over SSH.** Requires server credentials in GitHub.
- **Prebuilt images in a container registry.** Adds a registry to publish to and manage.
- **Netlify with Supabase.** No long-running process for the price job, and free-tier limits that a semester could reach.

## Consequences

- The deployment guide is part of the product. A change that affects it includes a run of the guide on a fresh Ubuntu system.
- Updates reach the server only when its owner runs them.
