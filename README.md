# Open Door Design

This repository is the OpenDoorDesign.org website: a Screen Reader First site covering Open Door Design's story, Accessibility Academy, Innovation Lab, current initiatives, and — as of this update — the Open Door Design Community.

## Site structure

- `index.html` and the other root `*-OpenDoorDesign.html` pages are the main site, sharing one header, primary navigation, and footer.
- `css/odd-theme.css`, `css/odd-layout.css`, `css/odd-components.css`, and `css/odd-utilities.css` are the shared design system: tokens, layout, components, and utilities. Every page on the site, including the Community pages, loads all four.
- `docs/Open-Door-Design-Phase-1-Design-System.md` documents the design tokens, contrast targets, and accessibility conventions those stylesheets implement.
- `community/` is the Open Door Design Community: an accessible introduction, registration, confirmation, and privacy-notice experience, plus its own engineering documentation and reference backend. See `community/README.md`.

## Accessibility approach

Open Door Design is built Screen Reader First: every page is designed to be understandable and operable by someone who cannot see the screen before its visual layout is considered. See `Accessibility-OpenDoorDesign.html` for the full accessibility commitment.

## Community (Feature 001 Community Registration, Feature 002 Community Dashboard Foundation, Feature 003 Community Registration Production Readiness)

The Community section is integrated into the main site's navigation, header, footer, and CSS, using the same restrained landmark structure as the rest of the site (Banner, Primary navigation, Main, Footer only — no region per heading). Registration is **not live**: the backend is deployment-ready but has not been deployed anywhere, and no hosting service has been selected, purchased, or connected. It includes:

- `community/index.html` — introduces the Community and invites participation before presenting registration.
- `community/register.html` — the registration form. On an invalid submission, focus moves directly to the first invalid field with a field-level error; there is no error summary. Client-side validation is a progressive enhancement over a real server submission.
- `community/welcome.html` — registration confirmation. States plainly that confirmation email delivery is still in development rather than promising an email has been sent.
- `community/privacy.html` — the Community Privacy Notice.
- `community/dashboard.html`, `community/downloads.html`, `community/research-opportunities.html` — the Community Dashboard foundation (Feature 002), accepted as an information architecture prototype with simulated access.
- `community/server/` — the registration backend (Express + SQLite): server-side validation, consent recording, a storage interface designed to be replaced by Salesforce later, a health endpoint, a rate limiter, and an email-provider abstraction with only a non-delivering development provider implemented. See `community/server/README.md` to run it, and `community/docs/architecture/Community Deployment Options.md` for the (unapproved) hosting recommendation.

Full status, remaining work, and the reasoning behind key decisions are recorded in:

- `community/docs/Community Roadmap.md`
- `community/docs/decisions/Decision Log.md`
- `community/docs/features/Feature 001 Community Registration.md`
- `community/docs/features/Feature 002 Community Dashboard Foundation.md`
- `community/docs/features/Feature 003 Community Registration Production Readiness.md`
- `community/docs/architecture/Community Deployment Options.md`
- `community/docs/operations/Community Data Operations.md`

## Repository rule

Returned repository ZIP files must exclude `.git` unless its inclusion is explicitly requested.
