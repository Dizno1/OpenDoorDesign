# Open Door Design Community

This folder contains the integrated Open Door Design Community experience and its engineering foundation, implementing Feature 001 Community Registration, Feature 002 Community Dashboard Foundation, and Feature 003 Community Registration Production Readiness.

## Included files

- `index.html` introduces the Community and explains why someone may want to participate, using the main site header, navigation, and footer.
- `register.html` provides the Screen Reader First registration experience and submits to the registration backend.
- `welcome.html` provides the registration confirmation page and links on to the Community Dashboard. It no longer promises a confirmation email has been sent — only a development email provider exists so far (see below).
- `privacy.html` provides the Community Privacy Notice.
- `dashboard.html`, `downloads.html`, `research-opportunities.html` provide the Community Dashboard shell (Feature 002), accepted as an information architecture prototype and not extended further in Feature 003.
- `assets/community.css` provides form, field-level error, and honeypot styling built on the shared `../css/odd-*.css` design tokens.
- `assets/community.js` provides accessible client-side validation as a progressive enhancement over the real server submission, moving focus directly to the first invalid field on a failed submission.
- `server/` contains the registration backend: an Express POST endpoint, server-side validation, SQLite storage behind a swappable interface, consent recording, a health endpoint, a rate limiter, and an email-provider abstraction. See `server/README.md` to run it locally, and `server/.env.example` for every configuration variable it reads.
- `server/test/` contains the backend test suite (Node's built-in test runner, no new dependency). `npm run test:offline` runs the subset that needs no external package; `npm test` runs everything once `npm install` has fetched `express` and `better-sqlite3`.
- `server/scripts/backup-database.js` backs up the live SQLite file; see `docs/operations/Community Data Operations.md`.
- `docs/architecture/Community Architecture.md` defines the current and target system architecture.
- `docs/architecture/Community Database.md` defines the data model, implemented in SQLite.
- `docs/architecture/Community Deployment Options.md` compares production hosting approaches and recommends one, pending Dean's approval — nothing has been deployed.
- `docs/operations/Community Data Operations.md` documents manual retention, correction, deletion, duplicate-handling, backup, and restoration procedures.
- `docs/features/Feature 001 Community Registration.md`, `Feature 002 Community Dashboard Foundation.md`, and `Feature 003 Community Registration Production Readiness.md` are the implementation specifications for each feature.
- `docs/Community Roadmap.md` defines the ordered development phases and current status.
- `docs/decisions/Decision Log.md` records approved architectural decisions.

## Current completed phase

Phase 1 (site integration) is complete. Most of Phase 2 (production registration) is complete: the backend validates and stores submissions in SQLite, records consent, applies honeypot, timing, and rate-limit spam controls, and re-renders the registration page with field-level errors, preserved values, and focus on the first invalid field on failure.

A JAWS-driven accessibility remediation (Decision Log, Decision 011) removed unnecessary named regions and replaced the registration form's linked error summary with direct focus to the first invalid field.

Feature 002 Community Dashboard Foundation is accepted as an information architecture prototype: a Dashboard shell, a Profile placeholder layout, a reusable "Community navigation" pattern, and placeholder Downloads and Research Opportunities pages, with simulated (not real) access. It was not extended in Feature 003.

Feature 003 Community Registration Production Readiness is complete for this pass: the false confirmation-email promise on `welcome.html` was corrected, a hosting comparison document was produced (recommendation only, nothing deployed), the backend gained environment-variable configuration, a health endpoint, a rate limiter, and an email-provider abstraction, manual data operations procedures were documented, the orphaned `Inquiries-OpenDoorDesign.html` page was removed, and a test suite was added.

## Current status

Registration is **not live** on OpenDoorDesign.org. The backend is deployment-ready but has not been deployed anywhere; `register.html`'s form posts to a path with no publicly reachable handler until hosting is selected (pending Dean's approval; see `Community Deployment Options.md`) and the backend is actually deployed and tested against the real site.

Confirmation email delivery does not exist yet — only a development provider that logs the intended email and never sends it. `welcome.html` says this plainly rather than promising delivery.

The Dashboard, Downloads, and Research Opportunities pages are reachable directly and describe planned functionality only.

The backend test suite has been written completely but only partially executed: this development sandbox has no network access, so the tests that need `express` or `better-sqlite3` could not run here (24 of 24 dependency-free tests passed; run `npm test` in an environment with network access for the rest).

## Next planned phase

1. Dean reviews and approves a hosting approach from `Community Deployment Options.md`.
2. Deploy `community/server` accordingly, point `register.html` at the real endpoint, and run the complete test suite against that deployment.
3. Select and configure a real confirmation email provider (the abstraction is ready for this).
4. Define an approved automatic retention period and complete the remaining `Community Data Operations.md` gaps.
5. Complete a JAWS, NVDA, VoiceOver, keyboard-only, zoom, and mobile test record.

For the Dashboard, the next step remains choosing one placeholder area (most likely Profile) to build out with real functionality — not started, and intentionally out of scope for Feature 003.

## Repository rule

Returned repository ZIP files must exclude `.git` unless its inclusion is explicitly requested. This applies to the `.git` directory itself — files like `.gitignore` that merely contain "git" in their name must still be included.
