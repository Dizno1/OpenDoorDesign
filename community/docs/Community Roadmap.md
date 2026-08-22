# Open Door Design Community Roadmap

## Current Phase

Phase 1 is complete. Phase 2 is operational in production. The Open Door Design Community registration flow is live through a Railway-hosted Node.js backend with SQLite persistence, consent recording, spam controls, accessible server-side validation, and provider-backed confirmation email delivery through Resend. Successful registrants receive a message from `Collaborate@community.opendoordesign.org` and can continue to the Community Dashboard.

Feature 002 (Community Dashboard Foundation), drawn forward from Phase 6, remains the information-architecture foundation for the member experience. Its pages are available, but authentication and connected member data are not yet implemented.

Completed:

- Community home, registration, welcome, and privacy pages integrated into the complete OpenDoorDesign website and shared design system.
- Accessible client-side and server-side validation with direct focus to the first invalid field.
- Railway production deployment for `community/server`.
- SQLite registration and consent storage.
- Duplicate-email handling, honeypot and timing-based spam signals, and single-instance rate limiting.
- Provider-backed confirmation email delivery through Resend.
- Production Community sender `Collaborate@community.opendoordesign.org`.
- Health endpoint and environment-variable-driven production configuration.
- Manual data correction, deletion, duplicate handling, backup, and restoration procedures.
- Community Dashboard shell, Profile foundation, Community navigation pattern, and Downloads and Research Opportunities pages.

Not yet completed:

- Real member authentication and connected profile data.
- Community activity and discussions.
- Protected/personalized downloads and member-specific Dashboard functionality.
- A rate limiter backed by a shared store if production is scaled beyond one instance.
- A defined, approved automatic retention period.
- Continued production privacy and security review.
- Complete cross-assistive-technology production test record.

## Phase 1 - Integrate the Community Experience

- [x] Add Community to the agreed primary navigation on the complete website.
- [x] Align the Community pages with the approved site templates and branding.
- [x] Verify all relative links.
- [x] Confirm page titles, headings, landmarks, and footer behavior.
- [x] Review registration content and field choices.

Deliverable: A complete static Community experience integrated into the OpenDoorDesign repository. Complete.

## Phase 2 - Production Registration

- [x] Select hosting and data-storage architecture. Railway hosts the Node.js backend; SQLite is the current registration store.
- [x] Create and deploy secure POST endpoint.
- [x] Add server-side validation.
- [x] Store registrations and consent records.
- [x] Add provider-backed confirmation email through Resend.
- [x] Add accessible system failure handling.
- [x] Add spam controls (honeypot, timing checks, and single-instance rate limiting).
- [ ] Complete privacy, retention, correction, and deletion procedures. Manual correction, deletion, backup, and restoration are documented; the automatic retention period remains undefined.

Deliverable: A production registration process that securely records Community members. **Operational in production.**

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
