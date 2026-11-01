# 0005. Sign-in is hand-written, with usernames and no email

- Status: Accepted
- Date: 2026-10-31

## Context

Accounts need no email, because sending email needs a paid service and an email address is personal data the class does not need. Lucia, once the standard small library for sessions, is deprecated, and its author now publishes a guide for implementing sessions directly. Better Auth, the leading library, expects an email for every account, was acquired by Vercel in July 2026, and had a critical vulnerability in 2026.

## Decision

- Lecturers and students sign in with a username and a password.
- Passwords are hashed with scrypt from `node:crypto`.
- Sessions follow the Lucia guide. A session is a random token, stored only as a hash, sent in a cookie that is HttpOnly and SameSite=Lax. Over HTTPS the cookie is also Secure and has the prefix `__Host-`. A demonstration on a laptop serves phones over plain HTTP on the local network, where a browser drops a Secure cookie, so a request over HTTP gets a cookie without both.
- The root middleware refuses every request that is not GET or HEAD and whose Origin header is not the site itself, and it shows the reader why. React Router checks only the forms of pages and answers with bare text, so `react-router.config.ts` leaves the check to the middleware.
- Sign-in attempts are rate limited.
- Express trusts the headers in which a proxy names the protocol and the address of a visitor only from a loopback or a private address. Caddy on the host of decision 0010 reaches the container of the app from the private address of the Docker network, so behind it the cookie is Secure and the limits count each visitor apart. The container therefore publishes its port only on the loopback address of the host, because any machine that reaches that port could forge those headers. On a local network during a demonstration, a phone could forge the address that the limit of an address counts, but the limit of a username still holds.
- A lecturer resets a student's password, because there is no email to reset it through.

## Alternatives

- **Better Auth** with placeholder emails, which works against its design.
- **Auth.js 5**, which is still in beta and now maintained by the Better Auth team.
- **Hosted identity services**, which cost money or add a service to run.
- **A session cookie that is always Secure**, which breaks sign-in during a demonstration on a local network.

## Consequences

- The sign-in code is small, fits the product exactly, and belongs to this repository, so this repository must keep it correct. Every change to it gets a security review.
- Students who forget their password ask their lecturer. A lecturer who forgets theirs asks the person who runs the server, who gives a new temporary password with the account command.
