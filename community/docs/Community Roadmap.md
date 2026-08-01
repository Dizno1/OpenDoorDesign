# Open Door Design Community Roadmap

## Current Phase

Phase 1 is complete. Phase 2 is substantially complete; see below. Feature 002 (Community Dashboard Foundation), drawn forward from Phase 6, is complete for its pass and was not extended further in this pass. Feature 003 (Community Registration Production Readiness) is complete for this pass; hosting selection still requires Dean's approval.

Completed:

- Community home, registration, welcome, and privacy pages integrated into the complete OpenDoorDesign website and its shared header, navigation, footer, and CSS.
- Client-side accessible validation, now layered as a progressive enhancement over a real server submission.
- Initial architecture, data model, and Feature 001 specification.
- Secure POST endpoint, server-side validation, SQLite storage, and consent recording (reference implementation; see `community/server/`).
- Duplicate-email handling, honeypot and timing-based spam signals, and accessible server-side error re-rendering with preserved values.
- A JAWS-driven accessibility remediation of the registration error experience and Community page landmark structure (Decision Log, Decision 011).
- Community Dashboard shell, Profile foundation, Community navigation pattern, and placeholder Downloads and Research Opportunities pages, with simulated access (Decision Log, Decision 012).
- Corrected `welcome.html`'s inaccurate confirmation-email promise (Decision Log, Decision 014).
- A deployment architecture comparison document, environment-variable-driven configuration, a health endpoint, a rate limiter, and an email-provider abstraction with a non-delivering development provider (Feature 003).
- Documented manual data operations: retention, correction, deletion, duplicates, backup, and restoration (`Community Data Operations.md`).
- Removed the orphaned `Inquiries-OpenDoorDesign.html` page (Decision Log, Decision 013); zero broken internal links across the site.

Not yet completed:

- Selecting (Dean's approval required) and deploying a hosting environment that can run the registration server in production (OpenDoorDesign.org is currently a static site; see Decision Log, Decisions 010 and 014, and `Community Deployment Options.md`).
- Real confirmation email delivery through an actual provider (only the non-delivering development provider exists).
- Rate limiting beyond the single-instance in-memory implementation (needs a shared store if the eventual hosting approach uses more than one instance).
- A defined, approved automatic retention period.
- Production privacy and security review.
- Cross-assistive-technology test record (JAWS, NVDA, VoiceOver, keyboard-only, zoom, mobile).
- Real Dashboard authentication and live profile data (Feature 002 built the structure only; see above).
- Running the full backend test suite (including database- and server-dependent tests) in an environment with network access — only the dependency-free subset was executed in this development sandbox (24 of 24 passing); see `Feature 003 Community Registration Production Readiness.md`, "Testing."

## Phase 1 - Integrate the Community Experience

- [x] Add Community to the agreed primary navigation on the complete website.
- [x] Align the Community pages with the approved site templates and branding.
- [x] Verify all relative links.
- [x] Confirm page titles, headings, landmarks, and footer behavior.
- [x] Review registration content and field choices.

Deliverable: A complete static Community experience integrated into the OpenDoorDesign repository. Complete.

## Phase 2 - Production Registration

- [ ] Select hosting and data-storage architecture. SQLite selected for storage (Decision 010); hosting for the server itself has a documented recommendation (`Community Deployment Options.md`) not yet approved by Dean.
- [x] Create secure POST endpoint. (`community/server/server.js`, not yet deployed publicly.)
- [x] Add server-side validation.
- [x] Store registrations and consent records.
- [ ] Add confirmation email. Abstraction and template complete; only a non-delivering development provider exists (Feature 003, Phase 4).
- [x] Add accessible system failure handling.
- [x] Add spam controls (honeypot and timing checks, plus a rate limiter added in Feature 003; the rate limiter is single-instance only, see "Not yet completed" above).
- [ ] Complete privacy, retention, correction, and deletion procedures. Correction, deletion, backup, and restoration are now documented as manual procedures (`Community Data Operations.md`); the automatic retention period itself is still undefined.

Deliverable: A production registration process that securely records community members. In progress — backend deployment-ready, not yet publicly deployed.

## Phase 3 - Community Operations

- Create an accessible administrative review process.
- Add controlled exports.
- Add communication preference handling.
- Add correction and deletion request workflow.
- Add reporting for registrations, interests, and participation preferences.

Deliverable:

A manageable community system that does not require direct database editing.

## Phase 4 - Meaningful Participation

- Invite beta testers for Innovation Lab projects.
- Support Academy interest and enrollment pathways.
- Track volunteer and partnership interest.
- Support project-specific invitations.
- Add accessible downloadable resources where appropriate.

Deliverable:

Community registration becomes a path to actual participation rather than a passive mailing list.

## Phase 5 - Salesforce Evaluation and Integration

- Confirm organizational eligibility and Salesforce nonprofit options.
- Define the approved Salesforce object model.
- Map existing data and consent records.
- Build a controlled synchronization service.
- Test duplicate management and error recovery.
- Keep the public website independent from Salesforce interface constraints.

Deliverable:

Salesforce becomes the relationship-management back office while OpenDoorDesign.org remains the accessible public experience.

## Phase 6 - Future Member Platform

Feature 002 (Community Dashboard Foundation) brought forward the dashboard shell and information architecture from this phase, at Dean's explicit direction, using simulated access instead of real authentication. See Decision Log, Decision 012, and `Feature 002 Community Dashboard Foundation.md`.

- [ ] Member authentication. Not yet built; Dashboard access is currently simulated.
- [x] Personal profiles. Placeholder layout complete (`community/dashboard.html`); not yet connected to stored registration data, and no editing exists.
- [ ] Communication preference center.
- [ ] Saved course progress.
- [ ] Protected downloads. Placeholder Downloads page exists (`community/downloads.html`); no protection or actual downloads exist yet.
- [x] Project dashboards. Dashboard shell complete with placeholder areas for Community Activity, Accessibility Academy, Innovation Lab, and Account Settings; none are functional yet.
- [ ] Research participation history. Placeholder Research Opportunities page exists (`community/research-opportunities.html`); no participation or signup workflow exists yet.

A separate repository should be considered once real authentication, protected downloads, and complex administration exist — not before. See `Community Architecture.md`, "Repository Boundary."

## Immediate Next Action

Dean's approval is needed on a hosting approach: review `community/docs/architecture/Community Deployment Options.md` and its recommendation (a Node-capable host for `community/server` alone, alongside GitHub Pages continuing to serve the static site). Once approved, deploy the backend, point `register.html`'s form at the deployed endpoint, and run the complete test suite (`community/server/test/`, including the database- and server-dependent tests not yet executed in this development sandbox) against that real environment before treating registration as live. Real confirmation-email provider selection is the next reasonable step after that, since the abstraction is ready for it.

For the Community Dashboard (Feature 002), the next step remains choosing which single placeholder area to build out first with real functionality — not yet started, and out of scope for Feature 003.
