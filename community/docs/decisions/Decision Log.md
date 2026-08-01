# Open Door Design Community Decision Log

## Decision 001 - Community Starts Inside the Main Repository

Status: Approved.

The first Community release remains inside the OpenDoorDesign repository. A separate application will be considered only when authentication, dashboards, protected resources, independent deployment, or substantial backend complexity justifies it.

## Decision 002 - Website Owns the Public Experience

Status: Approved.

OpenDoorDesign.org remains the Screen Reader First front door. Databases, email services, and any future Salesforce implementation operate behind the site rather than determining the public interface.

## Decision 003 - Registration Is Not an Account

Status: Approved.

Feature 001 invites participation and does not create a password-based member account. Authentication and dashboards are outside the first release.

## Decision 004 - Minimum Required Information

Status: Approved.

First name, last name, email address, and privacy consent are required. Interests, accessibility perspectives, participation preferences, and personal introduction remain optional.

## Decision 005 - Accessibility Perspectives Remain Optional

Status: Approved.

The form may invite people to share accessibility perspectives, but it must not require disclosure, imply diagnosis, or use the information to exclude or rank participants.

## Decision 006 - Production Uses Secure POST Submission

Status: Approved.

Personal data must not appear in a URL. The static GET prototype must be replaced with a secure POST endpoint before production use.

## Decision 007 - Salesforce Is a Future Integration, Not a Launch Dependency

Status: Approved.

The first production system must preserve Salesforce readiness through clean data structures and exportability. Public launch of Community registration does not depend on acquiring or configuring Salesforce.

## Decision 008 - No Inaccessible CAPTCHA

Status: Approved.

Spam controls should begin with honeypot fields, rate limiting, timing checks, duplicate handling, and email verification when needed. Visual or audio puzzle CAPTCHA must not be the default protection.

## Decision 009 - Community Navigation Position and Scope

Status: Approved. Recorded by Chip during Phase 1 integration.

Community was added to the primary navigation immediately after the Join the Journey / Follow the Journey entry and before Accessibility Commitment, on every page that carries the shared navigation. This groups the two ways a visitor can engage with the project's progress (Join/Follow the Journey) next to the way a visitor can formally participate (Community).

`Inquiries-OpenDoorDesign.html` was intentionally left unmodified. Its navigation links to pages that do not exist anywhere else in this repository (`AboutDean-OpenDoorDesign.html`, `OpenDoorAccessibilityLab-OpenDoorDesign.html`, `FeaturedProjects-OpenDoorDesign.html`) and does not match the shared navigation used by every other page; the current `Inquiries-OpenDoorDesign.html` is also not linked from any other page's navigation. It appears to be an orphaned or superseded page rather than part of the current site template. Editing its navigation to add Community risked reinforcing a broken, unreachable page rather than the live site. This should be revisited with Dean: either restore it to the shared template and delete the missing-page links, or remove it from the repository.

## Decision 010 - SQLite Selected as the Initial Community Data Store, Registration Backend Built Ahead of Full Hosting Selection

Status: Approved. Recorded by Chip during Feature 001 implementation, at Dean's explicit direction to build the registration backend and database now rather than waiting for Community Roadmap Phase 2.

SQLite (via `better-sqlite3`) is selected as the first production data store, satisfying `Community Database.md`'s technology selection criteria for a low-volume launch: zero-configuration, file-based, supports the full relational model already documented (`community_members`, `interests`, `accessibility_perspectives`, `participation_preferences`, their join tables, `consent_records`, `registration_events`, and a reserved `email_verifications` table), and exports cleanly to a future Salesforce integration. This is a technology selection only; it does not commit Open Door Design to SQLite in the long term, and `Community Database.md`'s "No technology is approved by this document" framing is superseded for the initial release by this decision.

The registration server (`community/server/`) implements the storage layer behind an explicit interface (`storage/registrationStore.js`) so that a future Salesforce-backed store can be substituted in `storage/index.js` alone, without changing the public HTML, `community.js`, or the POST contract at `/community/api/register`, per Decision 002 and Decision 007.

Deviation from the documented sequence, and why: `Community Roadmap.md` places server-side submission, database selection, and persistence in Phase 2, after Phase 1 site integration is deployed and reviewed. Dean directed Chip to build the database and backend in this same pass. The backend and schema are complete and functionally tested (server-side validation, error re-rendering with preserved values, duplicate-email handling, consent recording, honeypot and timing spam checks), but they are not yet live in production, because of a technical limitation, not an oversight: `CNAME` shows OpenDoorDesign.org is deployed as a static site (consistent with GitHub Pages), which cannot execute the Node.js server this feature requires. `register.html`'s form now submits to `api/register` as production markup will, but that path has no live handler until a Node-capable host (or an equivalent serverless function) is selected and deployed in front of, or alongside, the static site. See `community/server/README.md` for how to run the reference implementation locally today. Confirmation email delivery and production-grade rate limiting remain outstanding, consistent with Community Roadmap Phase 2.

## Decision 011 - JAWS Remediation: Landmark Restraint, No Error Summary, Direct-to-Field Focus

Status: Approved. Recorded by Chip after Dean's JAWS testing surfaced the corrections below.

### Reduce unnecessary regions

`aria-labelledby` was removed from every ordinary `<section>` on `community/index.html`, `community/privacy.html`, and `community/welcome.html` (and the `<section aria-labelledby="contact-heading">` wrapper was removed from `community/register.html`). None of those sections are named landmarks anywhere else on OpenDoorDesign.org; a heading alone is sufficient, and heading navigation already exposes the same structure. Only the four essential landmarks remain on every Community page: Banner, Primary navigation, Main, and Footer. The registration `<form>` was left without its own accessible name, matching the instruction that it "may remain a form landmark" as-is.

### Error summary removed

The linked "There is a problem" error summary (`role="alert"`, a `<ul>` of links duplicating every field error, and automatic focus to the summary) has been removed entirely from `community/register.html`, matching the preferred remediation over the "shortened summary" alternative. There is no replacement summary element and no page-level alert region.

### Direct-to-first-invalid-field focus

`community/assets/community.js` now determines the first invalid field in document order (First name, Last name, Email, Privacy confirmation) and moves focus to it directly on an invalid client-side submission — never to a summary. Each field's own error paragraph is shown and connected through the same `aria-describedby` it always had, and `aria-invalid="true"` is set only on invalid controls. Correcting one field only ever clears that field's own error and never moves focus.

The email field now produces two distinct messages instead of one generic message: "Enter your email address." when empty, and "Enter an email address in a valid format." when entered but malformed. The server (`community/server/lib/validate.js`) uses the identical wording so a person sees the same message whether JavaScript or the server caught the problem.

Server-rendered error pages (`community/server/lib/renderRegisterPage.js`) now add an `autofocus` attribute to the first invalid field's input instead of any summary, so a person submitting with JavaScript disabled still lands on the first problem when the server's response page loads, without requiring script.

### Root cause of the reported duplicate checkbox announcement

Inspection confirmed no checkbox is duplicated in the DOM anywhere in `community/register.html`; every checkbox `value` appears exactly once. The actual defect was in `community/server/lib/validate.js`: missing privacy consent could produce two separate, identically worded error objects for the same field (one from the consent check, one from the notice-version check), which the removed error summary would have rendered as two list items for the same control. That duplicate-producing logic has been merged into a single check. This was a genuine bug, not only a noisy-summary problem, and is fixed independently of the summary's removal.

### Testing completed

The six required submissions were run against the server-side validation and rendering (`validateRegistration` plus `renderRegisterPageWithErrors`) and confirmed by inspecting the rendered output: all-empty (four errors, focus/`autofocus` on First name), first-name-only (three errors, focus on Last name), malformed email (one error, correct distinct-format message, focus on Email), missing privacy confirmation only (one error, focus on Privacy confirmation), correcting one field while others remain invalid (client-side `recheck` clears only the corrected field), and a fully valid submission (zero errors, no `autofocus`, normal POST proceeds). Live JAWS re-testing of the deployed pages by Dean is still the final verification step; this pass verified the underlying markup and logic each JAWS behavior depends on.

## Decision 012 - Feature 002 Dashboard Built Ahead of Roadmap Phase 6, with Simulated Authentication

Status: Approved. Recorded by Chip at Dean's explicit direction to begin Feature 002 Community Dashboard Foundation.

`Community Roadmap.md` Phase 6 ("Future Member Platform") lists member dashboards, personal profiles, and project dashboards as work to "consider only after real community needs justify the complexity," after Phases 3 through 5, and suggests a separate repository "should be considered" at that point. Dean directed Chip to build the Dashboard's information architecture now, with authentication simulated rather than real, explicitly to get the structure right before layering in authentication, databases, and Salesforce.

This is a deliberate product-sequencing decision, not a technical limitation, so it does not change any existing architecture — it adds new pages (`community/dashboard.html`, `community/downloads.html`, `community/research-opportunities.html`) that describe planned functionality without implementing it. No session, cookie, token, or client-side storage gates access to these pages; they are reachable by direct link (most naturally from `community/welcome.html` after registration) and each states in plain text that access is currently simulated. None of the three pages were added to the main site's primary navigation, so they remain reachable without being presented to visitors who have not registered.

The Repository Boundary section of `Community Architecture.md` ties separating Community into its own repository to real authentication, member dashboards, and protected downloads existing — Feature 002 intentionally does not cross that threshold yet, since authentication remains simulated and there is no protected content behind it. That boundary decision should be revisited once real sign-in is built, not before.

While reviewing `Community Architecture.md` for this feature, found and corrected a stale line in its Accessibility Baseline section that still described "an error summary receiving focus after failed submission" — that behavior was removed in Decision 011 and replaced with direct focus to the first invalid field. Noting the correction here since it was discovered, not requested, during this pass.

## Decision 013 - Inquiries Page Removed as Obsolete and Unreferenced

Status: Approved. Recorded by Chip during Feature 003, Phase 6, at Dean's explicit direction to resolve the page flagged in Decision 009.

`Inquiries-OpenDoorDesign.html` contained three broken internal links (`AboutDean-OpenDoorDesign.html`, `OpenDoorAccessibilityLab-OpenDoorDesign.html`, `FeaturedProjects-OpenDoorDesign.html`, none of which exist anywhere in the repository) and used a navigation structure that did not match the shared site template. Re-confirmed via repository-wide search that no other page links to it. It has been removed rather than rebuilt, since nothing in the current site points to it and its content (an "Inquiries" contact concept) is already covered by `Contact-OpenDoorDesign.html` and the footer's `Inquiries@OpenDoorDesign.org` mailto link present on every page. Internal link validation (`scripts/check-links.py`) confirms zero broken internal links across the site after removal.

## Decision 014 - Community Registration Production Readiness Package: Deployment Recommended, Not Approved or Deployed

Status: Approved for documentation and backend readiness work. Hosting selection itself remains pending Dean's approval. Recorded by Chip during Feature 003.

Feature 003 moved the registration backend from a local reference implementation toward a deployable service: environment-variable-driven configuration (`community/server/config.js`, `.env.example`), a dependency-free rate limiter, a health endpoint, an email-provider abstraction with only a development (non-delivering) provider implemented, and documented manual data operations procedures. None of this was deployed to any external host, and no paid service was selected or purchased, per the explicit instruction that produced this feature.

`Community Deployment Options.md` recommends a Node-capable host for `community/server` alone, with GitHub Pages continuing to serve the static site (its "Option B"), over a serverless-function approach (weaker SQLite fit) and a full site migration (larger, riskier domain change). This is a recommendation for Dean's approval, not a decision to proceed — see that document's own "Recommendation" section, which states this explicitly.

Two things were true before this session started and remain true after it: registration is not live on OpenDoorDesign.org, and `register.html`'s form still posts to a path (`api/register`) with no publicly reachable handler. Nothing in this feature changes that; it only makes the path to changing it shorter and better-documented, per `Feature 003 Community Registration Production Readiness.md`'s "Remaining Production Blockers" and "Next Recommended Feature."

Separately: the ZIP delivered at the end of the prior session's response was never actually produced or attached — the response ended with a status summary and a question instead of a file. Dean caught this by re-uploading and asking whether it was the intended file. Noting it here as a process correction: a described deliverable is not the same as a produced one, and this session's response confirms the ZIP was actually built and presented before ending.

## Decision 015 - Corrected `npm test` Script Defect; Noted a Packaging Discrepancy from the Prior Delivery

Status: Approved. Recorded by Chip after Dean reviewed the delivered Feature 003 ZIP directly and reported a verified defect.

`community/server/package.json`'s `test` script read `node --test test/`, which failed with "Cannot find module" when invoked as `npm test`. Corrected to explicitly list every test file (for example `node --test test/config.test.js test/email.test.js ...`) rather than rely on Node's directory-argument test discovery, which is unambiguous across Node versions and platforms. `test:offline` was corrected the same way and now also includes the previously-missing `test/renderRegisterPage.test.js`, which existed in the repository but had not been added to either script. Running the corrected `test:offline` script surfaced one genuine test bug (not a code bug): a new test asserted an escaped apostrophe (`O&#39;Brien`) that `renderRegisterPage.js`'s `escapeHtml` correctly does not produce, since an unescaped apostrophe inside a double-quoted HTML attribute is safe. The test assertion was corrected to match the correct, existing behavior.

Also found while investigating this: the ZIP Dean reviewed still contained `Inquiries-OpenDoorDesign.html`, despite Decision 013 recording its removal and this repository's own working state (verified before this fix) not containing the file. The cause was not conclusively identified from available evidence. The file is confirmed absent from the current working state and from the corrected ZIP's contents (verified by listing the ZIP's contents directly after packaging, not only the source directory, specifically to catch a repeat of this class of discrepancy). If a stale or duplicated file appears in a future delivered ZIP despite the source directory being correct, treat it as a packaging-step defect to investigate rather than assuming the source of truth is wrong.

`npm install` was attempted twice more in this session and failed both times with the same 403 error as in Decision 014's session — this sandbox has no network access to the npm registry. The full test suite (including the database- and server-dependent tests) remains unexecuted here; see `Feature 003 Community Registration Production Readiness.md` for the exact count of what was and was not run.
