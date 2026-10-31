# 0003. React Router runs the app

- Status: Accepted
- Date: 2026-10-31

## Context

Students often use phones on mobile data, so pages must render on the server and load fast. Forms such as the order ticket should work before JavaScript loads. Types should flow from the server to the interface without a separate API layer. The app runs as one Node process on one VPS.

## Decision

Portolab uses React Router 8 in framework mode, with server rendering on and React Server Components off, on Node 26, the active long-term support line.

## Alternatives

- **SvelteKit 3.** Less code per screen and smaller pages, but version 3 was one month old, and Svelte is less widely known than React.
- **Hono with a client-rendered React app.** The smallest server, but the first load on a phone is slower, and the API becomes a separate layer.
- **Next.js 16.** Five critical security advisories in 2026, and many features assume Vercel's hosting.
- **TanStack Start 1.0.** Announced two weeks before this decision, with critical advisories during its beta.

## Consequences

- Loaders and actions get generated types, so the server and the interface share one source of truth.
- Upgrades follow React Router's major versions.
- React knowledge transfers to anyone who maintains the code later.
