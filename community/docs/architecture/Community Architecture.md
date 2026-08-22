# Open Door Design Community Architecture

## Purpose

The Open Door Design Community provides an accessible path for visitors to become participants in Open Door Design. The first release supports community registration, confirmation, privacy information, and future integration with a secure data service.

The public website remains the Screen Reader First front door. Data storage, email delivery, reporting, and any future Salesforce connection remain behind the public experience.

## Current Architecture

The Community pages are integrated into the main OpenDoorDesign site template and contain:

- `index.html` for the Community introduction, using the shared header, navigation, and footer.
- `register.html` for the registration experience, submitting by HTTPS-ready POST to `api/register`.
- `welcome.html` for confirmation, linking on to the Community Dashboard as the next step.
- `privacy.html` for the Community Privacy Notice.
- `dashboard.html`, `downloads.html`, and `research-opportunities.html` (Feature 002) for the Community Dashboard foundation: a placeholder shell for future member capabilities, a Profile area matching the registration data model, and a second "Community navigation" landmark shared across these three pages. Access is currently simulated; see `Feature 002 Community Dashboard Foundation.md` and Decision Log, Decision 012.
- `assets/community.css` for form and field-level error styling built on the shared `../css/odd-*.css` design tokens.
- `assets/community.js` for client-side validation as a progressive enhancement over the real server submission.

The production registration backend lives at `community/server/`: an Express endpoint, server-side validation matching the client rules, SQLite storage behind a swappable storage interface, and consent recording. Railway hosts this backend in production while OpenDoorDesign.org continues to serve the public site. See `community/server/README.md` and Decision Log, Decision 016.

Feature 003 added the deployment-readiness pieces now used by the production service: environment-variable-driven configuration (`config.js`, `.env.example`), a health endpoint, a dependency-free rate limiter, and the email-provider abstraction (`email/`). Production email uses the implemented Resend provider; development can still use the non-delivering console provider. `docs/architecture/Community Deployment Options.md` is retained as the record of the pre-deployment hosting evaluation. `docs/operations/Community Data Operations.md` documents the manual procedures (retention, correction, deletion, backup, restoration) that apply until an administrative interface exists.

## Target Architecture

The production architecture should follow this sequence:

1. A visitor opens the Community page.
2. The visitor activates the registration link.
3. The registration form collects only the information needed for participation.
4. Client-side validation provides immediate assistance without replacing server-side validation.
5. The form submits through HTTPS to a secure server endpoint.
6. The server validates and normalizes the submitted values.
7. The server records consent and stores the registration in the selected database.
8. The system sends an accessible confirmation email.
9. The browser loads a confirmation page with a unique page title and clear next actions.
10. A future integration service may synchronize approved data with Salesforce.

## Architectural Principles

### Screen Reader First

The registration experience must be understandable and operable without visual inspection. Form groups, instructions, errors, status messages, and confirmation must be available programmatically and in a predictable reading order.

### Website Owns the Experience

The public form must remain part of OpenDoorDesign.org. A database, customer relationship management platform, or email provider must not dictate the public interaction design.

### Analyze Before Integrating

The project must define what data is needed and why before selecting the production data service. Salesforce readiness is required, but Salesforce dependency is not.

### Minimum Necessary Data

Only first name, last name, email address, and privacy consent are required for the first release. Interests, perspectives, participation preferences, and the introduction are optional.

### Progressive Growth

The first production release should support registration and secure storage. Member accounts, authentication, dashboards, downloads, course enrollment, and Salesforce synchronization are future features and must not be forced into Feature 001.

## Major Components

### Public Pages

- Community home
- Registration
- Privacy notice
- Registration confirmation

### Registration Service

Responsibilities:

- Receive POST requests.
- Validate all submitted values.
- Reject unsupported or malformed values.
- Apply spam protection that does not create an assistive technology barrier.
- Record the consent version and timestamp.
- Store the registration securely.
- Trigger the confirmation email.
- Return an accessible success or error response.

### Data Store

The first data store may be a small relational database or managed service. It must support export, deletion, correction, backups, access controls, and future Salesforce mapping.

### Email Service

The confirmation email must:

- Confirm that registration was received.
- Avoid exposing sensitive form responses.
- Identify Open Door Design clearly.
- Provide a contact method for corrections or deletion.
- Use a meaningful subject line and plain, accessible content.

Status: the template and provider abstraction exist (`community/server/email/`). Development can use the console provider; production uses the implemented Resend provider and sends confirmation messages from `Collaborate@community.opendoordesign.org`. See `community/server/email/README.md`.

### Future Salesforce Integration

Salesforce should receive approved community records through an integration layer, not direct browser submission. The integration must preserve consent, source, interests, participation preferences, and synchronization status.

## Security and Privacy Boundaries

- Use HTTPS for every production submission.
- Never place personal data in a query string.
- Never store personal data in browser local storage.
- Perform server-side validation even when client-side validation succeeds.
- Limit administrative access to authorized people.
- Record consent version and timestamp.
- Provide correction and deletion procedures.
- Define retention before launch.
- Do not request medical records, financial information, passwords, government identifiers, or unnecessary sensitive information.

## Accessibility Baseline

The production experience must include:

- Unique and descriptive page titles.
- One H1 per page.
- Predictable headings and landmarks.
- Visible labels for every form control.
- Required status communicated in text and markup.
- Field-level errors connected to their controls, with focus moving directly to the first invalid control after a failed submission (no error summary; see Decision Log, Decision 011).
- Keyboard completion without traps or unexpected focus movement.
- No inaccessible CAPTCHA.
- A confirmation page and email that do not rely on color, layout, or images.
- Testing with JAWS, NVDA, VoiceOver, keyboard-only operation, mobile browsers, and zoom.

## Repository Boundary

The Community folder remains inside the OpenDoorDesign repository for the first production release. It should become a separate application only when authentication, member dashboards, protected downloads, complex administration, or independent deployment makes separation necessary.
