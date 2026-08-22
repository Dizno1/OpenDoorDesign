# Feature 003 Community Registration Production Readiness

> Current production status, August 2026: Registration is now live on OpenDoorDesign.org through the Railway-hosted backend. SQLite persistence and provider-backed confirmation email delivery through Resend are operational. Pre-deployment statements below are retained as historical documentation of the feature state when this document was written.

## Status

In progress. This phase moved the registration backend from a local reference implementation toward a deployable service, without deploying it anywhere. No hosting decision has been made; that requires Dean's approval. Registration is not live on OpenDoorDesign.org.

## Scope note

Feature 002 (Community Dashboard Foundation) is accepted as an information architecture prototype and was not extended in this phase — no new Dashboard placeholder areas or Dashboard functionality were added. This feature is entirely about Feature 001's registration backend becoming deployable.

## Phase 1 - Corrected Inaccurate Public Content

`community/welcome.html` no longer promises "A confirmation email will be sent to the address you provided." It now states plainly that confirmation email delivery is still in development and has not been sent, with a contact address for questions in the meantime. The rest of the Community pages and documentation were reviewed; no other statement was found describing unbuilt functionality as already working.

## Phase 2 - Hosting Architecture Package

`community/docs/architecture/Community Deployment Options.md` compares three approaches (a serverless endpoint alongside GitHub Pages, a Node-capable host for the backend alongside GitHub Pages, and moving the whole site to one host) against deployment structure, required repository changes, environment variables, SQLite compatibility, persistent storage limitations, custom-domain implications, accessibility implications, operational complexity, free-tier/paid considerations, and Salesforce migration implications. It recommends the second approach (a Node host for `community/server` only) but does not select, purchase, or deploy to any specific provider. See Decision Log for the entry recording this document.

## Phase 3 - Deployment Readiness

- `community/server/config.js` centralizes every configuration value, reading it from environment variables and throwing one clear error listing everything missing when `NODE_ENV=production` and a required value is absent.
- `community/server/.env.example` documents every variable; no real secret exists in the repository.
- `community/server/lib/rateLimiter.js` adds a dependency-free, in-memory, per-IP rate limiter, applied to the registration route. Documented as single-instance only — see "Remaining production blockers."
- `GET /community/api/health` checks database connectivity and returns a JSON status.
- `server.js` was restructured around `buildApp(config, store)` for testability, with structured startup logging and a clean, logged failure path (no crash with a raw stack trace) when required production configuration is missing.
- The honeypot field, timing check, and the entire storage abstraction (`storage/registrationStore.js`) are unchanged. Server-side validation (`lib/validate.js`) is unchanged except for the two-distinct-messages email fix already made in the JAWS remediation (Decision Log, Decision 011) — nothing was weakened.
- SQLite was not removed; see Decision Log, Decision 010, which remains in effect.

## Phase 4 - Confirmation Email Architecture

- `community/server/email/emailProvider.js` documents the provider interface (mirroring `storage/registrationStore.js`'s pattern).
- `community/server/email/consoleEmailProvider.js` is the only implemented provider: it logs the email it would send and always returns `{ sent: false }` — it never claims delivery.
- `community/server/email/templates/confirmationEmail.js` generates the subject, a plain-text body, and an accessible HTML body (no images, no color-only meaning, escaped user input) from a member's first name and email.
- `community/server/email/emailService.js` selects the configured provider (via `EMAIL_PROVIDER`) and sends the confirmation email.
- `server.js` calls the email service only after storage has already succeeded, and a failure there is logged and recorded as a `registration_events` row without changing the response the visitor receives or undoing the registration.
- `community/server/email/README.md` documents exactly how a real provider will be added later: a new file implementing the same interface, reading its own credential from its own environment variable, and one new `case` in `emailService.js`. No provider name or credential is hard-coded anywhere.

## Phase 5 - Data Procedures

`community/docs/operations/Community Data Operations.md` documents manual procedures (no administrative interface exists yet) for retention, correction requests, deletion requests, duplicate registrations, registration-event retention, consent-record preservation, database backup, and database restoration. `community/server/scripts/backup-database.js` implements the backup step referenced there.

## Phase 6 - Resolved the Orphaned Inquiries Page

`Inquiries-OpenDoorDesign.html` was confirmed unreferenced by any other page in the repository (already flagged in Decision Log, Decision 009) and removed. See Decision Log, Decision 013.

## Phase 7 - Testing

A test suite was added under `community/server/test/` using Node's built-in test runner (`node:test`), avoiding a new dependency. It covers every case requested: empty registration, invalid email, missing privacy confirmation, duplicate email, honeypot rejection, timing rejection, rate-limit rejection, successful storage, email service success, email service failure after successful storage, database initialization, the health endpoint, and server startup with missing required configuration.

**What was actually run in this session, and what was not:** this development sandbox has no network access, so `npm install` cannot fetch `express` or `better-sqlite3` (both are required by the backend) — confirmed by repeated attempts across sessions, most recently while correcting the `npm test` script defect described below. Tests that depend on neither package — validation, honeypot/timing checks, the rate limiter, configuration/startup handling, the email service and template, and server-side error re-rendering — were executed directly in this session: 27 of 27 passed (`npm run test:offline`). Tests that require `express` or `better-sqlite3` — the SQLite storage layer, the health endpoint, and full HTTP-level registration flows including duplicate handling and rate limiting — were written and reviewed for correctness but could not be executed here, and each such file says so at the top. Run `npm install && npm test` in an environment with network access to execute the complete suite (38 tests total: 27 offline plus 11 requiring the two packages above).

**Correction after review:** the `test` script in `package.json` originally read `node --test test/`, which failed with "Cannot find module" when run as `npm test` rather than invoked directly. It has been corrected to explicitly list every test file (`node --test test/config.test.js test/email.test.js ...`), which is unambiguous across Node versions and platforms rather than relying on directory-argument auto-discovery.

Internal link validation (`scripts/check-links.py`) was run against the complete site: 357 local links checked across 18 HTML files, zero broken, after Phase 6's removal of the Inquiries page.

## Phase 8 - Documentation

This document, `Community Deployment Options.md`, and `Community Data Operations.md` are new. `README.md`, `community/README.md`, `Community Roadmap.md`, `Community Architecture.md`, `Community Database.md`, and the Decision Log were updated; see each for specifics.

## Remaining Production Blockers

- **Hosting decision.** Recommended in `Community Deployment Options.md`, not yet approved by Dean or deployed.
- **Rate limiter is single-instance only.** If the eventual hosting approach runs more than one server instance, `lib/rateLimiter.js`'s in-memory store must be replaced with a shared store (for example Redis-backed) before it can be trusted at scale.
- **A real email provider.** Only the development console provider exists; no email is actually delivered yet.
- **Retention period undefined.** `Community Data Operations.md` documents correction, deletion, and backup procedures, but the specific automatic retention period for inactive members has not been set by Dean.
- **Pending-status duplicate detection is manual.** The automatic duplicate check only covers `active` members; a documented manual query covers the gap for `pending` members until an administrative interface exists.
- **The DB-dependent test suite has not actually been executed**, only reviewed, because of this sandbox's lack of network access (see Phase 7). It should be run in a normal development environment or CI before being relied upon.
- **No live JAWS/NVDA/VoiceOver re-test of Phase 3-4's changes** — none of this phase touched the public-facing HTML or CSS (only `welcome.html`'s one corrected sentence), so no new screen reader defect is expected, but this has not been independently verified against real assistive technology.

## Next Recommended Feature

Once Dean approves a hosting approach from `Community Deployment Options.md`: deploy `community/server`, connect `register.html`'s form action to the deployed endpoint, and run the full test suite (including the DB-dependent tests) against that real environment before calling registration live. Real confirmation email delivery (choosing and wiring an actual provider) is the next reasonable feature after that, since the abstraction built in Phase 4 is ready for it.
