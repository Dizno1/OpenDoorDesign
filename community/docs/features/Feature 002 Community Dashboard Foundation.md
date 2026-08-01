# Feature 002 Community Dashboard Foundation

## Status

Complete for this phase. This establishes the information architecture and page shell that future Community capabilities will build on. No real functionality (authentication, live profile data, downloads, or research signup) is implemented; every area is explicitly labeled as planned.

## Purpose

Give registered Community members a single place that will eventually bring together their profile, activity, learning progress, downloads, and research participation. This phase builds the structure only, so later features (Academy enrollment, Innovation Lab participation, beta testing, downloads, real authentication, Salesforce synchronization) each have an established place to land instead of being designed from scratch.

## Relationship to the Community Roadmap

`Community Roadmap.md` Phase 6 ("Future Member Platform") originally placed member dashboards, personal profiles, and project dashboards after Phase 3 (Community Operations), Phase 4 (Meaningful Participation), and Phase 5 (Salesforce Evaluation and Integration), and suggested a separate repository "should be considered" once real authentication and dashboards were needed. Feature 002 moves the dashboard's information architecture earlier, at Dean's explicit direction, while deliberately keeping it inside this repository and using simulated access instead of real authentication. See Decision Log, Decision 012.

## Phase 1 - Dashboard Shell

`community/dashboard.html` is reachable directly (simulated access; see "Simulated Authentication" below) and uses the standard Open Door Design template: shared banner, primary navigation, and footer.

Contains:

- H1: Community Dashboard.
- A welcome message and a short explanation of the Dashboard's purpose.
- A plain-text simulated-access notice.
- Placeholder areas for all seven initial sections: Profile, Community Activity, Accessibility Academy, Innovation Lab, Downloads, Research Opportunities, and Account Settings. Each placeholder area states its status ("Planned functionality. Not yet available.") in text.

No functionality behind any of these seven areas is implemented in this phase.

## Phase 2 - Profile Foundation

The Profile area on `community/dashboard.html` presents a description list (`<dl class="kvl">`) with placeholders matching the registration data model in `Community Database.md`: Name, Email, Community interests, Accessibility perspectives, Participation preferences, and Biography. Every value currently reads "Not yet connected to your registration." No editing controls exist yet, matching the phase's scope.

## Phase 3 - Dashboard Navigation

A second navigation landmark, labeled "Community navigation" (distinct from "Primary navigation"), appears on `community/dashboard.html`, `community/downloads.html`, and `community/research-opportunities.html`, directly below the primary navigation. It lists Community Dashboard, Downloads, and Research Opportunities, and marks the current page with `aria-current="page"`, matching the convention already used by the primary navigation. This pattern is intended to be reused as future Community member-area pages are added, rather than redesigned per page.

## Phase 4 - Downloads Framework

`community/downloads.html` is a placeholder page describing four planned categories: Academy resources, Innovation Lab builds, accessibility documents, and future publications. No download logic, file listing, or storage exists yet.

## Phase 5 - Research Opportunities

`community/research-opportunities.html` is a placeholder page describing four planned opportunity types: usability studies, beta testing, accessibility reviews, and collaboration opportunities. No signup workflow exists yet.

## Simulated Authentication

Feature 002 does not implement real sign-in. `community/dashboard.html`, `community/downloads.html`, and `community/research-opportunities.html` are reachable by direct link, most naturally from `community/welcome.html`'s "Continue exploring" list after a successful registration. Each page states in plain text that access is currently simulated and that real sign-in is planned. No session, cookie, token, or client-side storage is used to gate access, and none of the pages are added to the main site's primary navigation, so they remain reachable but not prominently advertised to visitors who have not registered.

## Accessibility Requirements

Consistent with the JAWS remediation recorded in Decision Log, Decision 011:

- Only the essential landmarks are used on every new page: Banner, Primary navigation, Community navigation, Main, and Footer. Ordinary content sections and placeholder cards (`<article class="card">`) are not given `aria-labelledby` and are not exposed as landmark regions.
- Heading hierarchy is predictable: one H1 per page, H2 for each major area, H3 for individual placeholder cards nested under a grouping H2.
- The Profile and card layouts reuse the site's existing `.kvl`, `.card`, and `.grid` / `.cols-2` / `.cols-3` classes already established in `css/odd-components.css` and `css/odd-layout.css` (visible in use on `AccessibilityAcademy-OpenDoorDesign.html` and `InnovationLab-OpenDoorDesign.html`), so no new CSS was needed and the pages match the rest of the site automatically.
- No new ARIA roles or attributes were introduced beyond the existing `aria-labelledby` pattern already used for the banner, navigation, and footer landmarks, and `aria-current="page"` for the active navigation item, both already established elsewhere on the site.
- Per this session's instruction, screen reader verbosity was not otherwise revisited in this pass, since no new defect was found beyond the landmark and heading decisions described above.

## Out of Scope for Feature 002

- Real authentication, sessions, or account creation beyond registration.
- Live profile data connected to the SQLite registration store.
- Editing any profile field.
- Any Downloads file listing, storage, or delivery.
- Any Research Opportunities signup, application, or scheduling workflow.
- Community Activity, Accessibility Academy progress, Innovation Lab participation, or Account Settings functionality.

## Acceptance Criteria

- [x] `community/dashboard.html` exists, uses the standard template, and includes all seven required placeholder areas.
- [x] The Profile area displays all six required placeholder fields from the registration data model.
- [x] A consistent "Community navigation" pattern appears on the Dashboard, Downloads, and Research Opportunities pages and correctly marks the current page.
- [x] `community/downloads.html` describes all four required planned categories.
- [x] `community/research-opportunities.html` describes all four required planned opportunity types.
- [x] No page in this feature introduces an unnecessary landmark region or unnecessary ARIA.
- [x] Every planned area is clearly labeled as not yet available, in text.
- [x] All new page titles are unique across the repository.
