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
- `docs/architecture/Community Deployment Options.md` records the hosting options considered before Railway was selected and deployed; it is retained as architectural history.
- `docs/operations/Community Data Operations.md` documents manual retention, correction, deletion, duplicate-handling, backup, and restoration procedures.
- `docs/features/Feature 001 Community Registration.md`, `Feature 002 Community Dashboard Foundation.md`, and `Feature 003 Community Registration Production Readiness.md` are the implementation specifications for each feature.
- `docs/Community Roadmap.md` defines the ordered development phases and current status.
- `docs/decisions/Decision Log.md` records approved architectural decisions.

## Current completed phase

Phase 1 (site integration) is complete. Phase 2 (production registration) is now operational in production. The registration form submits to the deployed Railway backend, server-side validation and SQLite storage are active, consent is recorded, spam controls are applied, and successful registrations trigger provider-backed confirmation email delivery through Resend.

The JAWS-driven accessibility remediation (Decision 011) remains the registration error-handling baseline: unnecessary named regions were removed and failed submissions move directly to the first invalid field rather than an error-summary detour.

Feature 002 Community Dashboard Foundation remains an information-architecture foundation. The Dashboard, Downloads, and Research Opportunities pages are available, but real sign-in, connected profile data, protected downloads, and personalized member functionality are still future work.

Feature 003 established the deployment, configuration, health-check, rate-limiting, email abstraction, and data-operations foundation that is now running in production. The later production deployment and Resend integration supersede Feature 003's original pre-deployment status statements. Historical feature and decision documents are retained as records of the state when those decisions were made.

## Current status

Registration is **live** on OpenDoorDesign.org. Railway hosts the Community backend, SQLite stores registration and consent records, and successful registrations receive a confirmation email from `Collaborate@community.opendoordesign.org` through the Resend provider. The production welcome flow directs new members to `community/dashboard.html`.

The Community Dashboard is available as the current starting point for members. Real authentication, personal profile connection and management, Community activity, discussions, protected downloads, and additional member-to-member features are not yet implemented.

The current rate limiter is still single-instance and in-memory. Manual data correction, deletion, backup, and restoration procedures are documented; an approved automatic retention period remains to be defined.

## Next planned phase

1. Complete and record cross-assistive-technology production testing, including JAWS, NVDA, VoiceOver, keyboard-only, zoom, and mobile.
2. Continue Community operations work: accessible administrative review, controlled exports, communication preferences, correction/deletion workflow, and reporting.
3. Connect one Dashboard area to real member functionality, with Profile the strongest candidate once authentication is designed.
4. Define the approved automatic retention period and continue privacy/security review.
5. Expand meaningful participation through testing invitations, Academy pathways, research, collaboration, downloads, and project-specific opportunities.

## Repository rule

Returned repository ZIP files must exclude `.git` unless its inclusion is explicitly requested. This applies to the `.git` directory itself — files like `.gitignore` that merely contain "git" in their name must still be included.
