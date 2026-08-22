# Feature 001 Community Registration

> Current production status, August 2026: Registration is now live on OpenDoorDesign.org through the Railway-hosted backend. SQLite persistence and provider-backed confirmation email delivery through Resend are operational. Pre-deployment statements below are retained as historical documentation of the feature state when this document was written.

## Status

In progress. Site integration and the registration backend are functionally complete; production deployment and email confirmation remain outstanding.

Completed: main-site navigation and template integration (see "Main Website Integration" below), the accessible front-end, server-side validation and error handling, SQLite storage with a Salesforce-ready schema, consent recording, honeypot/timing spam signals, and a JAWS-driven accessibility remediation of the registration error experience and Community page landmark structure (Decision Log, Decision 011).

Remaining before public launch: selecting and deploying a hosting environment that can run the registration server (see Decision Log, Decision 010), confirmation email delivery, production-grade rate limiting, retention/correction/deletion procedure documentation, and cross-assistive-technology test recording.

## Purpose

Allow a visitor to join the Open Door Design Community through a welcoming, Screen Reader First registration experience that collects only the information needed to begin a relationship.

## Business Goals

- Convert interested visitors into community participants.
- Understand community interests and preferred participation opportunities.
- Create a secure source of community records.
- Support future communication and Salesforce integration.
- Demonstrate an accessible registration pattern that can later become part of the Accessible Component Library.

## Out of Scope for Feature 001

- Passwords or member authentication.
- Member dashboards.
- Course enrollment records.
- Protected downloads.
- Payment processing.
- Automated Salesforce synchronization.
- Complex preference centers.
- Public community profiles.

## User Flow

1. Visitor encounters a Community link in the primary navigation or relevant page content.
2. Visitor opens the Community home page.
3. Visitor reviews the purpose, participation options, and privacy information.
4. Visitor activates "Join the Open Door Design Community."
5. Visitor completes required and optional fields.
6. Visitor submits the form.
7. Invalid submissions receive a focused error summary and field-specific errors.
8. Valid submissions are validated by the server and stored securely.
9. Visitor receives a confirmation page.
10. Visitor receives a confirmation email.

## Required Fields

### First Name

- Data type: text.
- Required: yes.
- Autocomplete: `given-name`.
- Trim leading and trailing whitespace.
- Reject empty values after trimming.
- Maximum length: 100 characters.

### Last Name

- Data type: text.
- Required: yes.
- Autocomplete: `family-name`.
- Trim leading and trailing whitespace.
- Reject empty values after trimming.
- Maximum length: 100 characters.

### Email Address

- Data type: email.
- Required: yes.
- Autocomplete: `email`.
- Normalize surrounding whitespace.
- Validate on the server.
- Maximum length: 254 characters.
- Use case-insensitive duplicate matching for registration review.

### Privacy Consent

- Data type: boolean plus recorded metadata.
- Required: yes.
- Record consent timestamp.
- Record privacy notice version.
- Do not infer consent from submission alone.

## Optional Fields

### Interests

Allowed initial values:

- Accessibility education
- Accessibility engineering
- Screen reader testing
- Document accessibility
- Web and mobile accessibility
- Media accessibility
- Artificial intelligence
- Research and collaboration

### Accessibility Perspectives

Allowed initial values:

- Screen reader user
- Keyboard-first user
- Low vision or magnification user
- Voice input user
- Deaf or hard of hearing
- Cognitive accessibility
- Accessibility professional
- Developer or designer learning accessibility
- Prefer not to say

This field must remain optional. It must not be used to diagnose, rank, exclude, or make medical assumptions about a community member.

### Participation Preferences

Allowed initial values:

- Learn through the Academy
- Test Innovation Lab projects
- Share accessibility feedback
- Join research studies
- Volunteer
- Explore partnerships
- Receive project updates

### About You

- Data type: long text.
- Required: no.
- Maximum length: 2,000 characters.
- Provide instruction not to submit medical, financial, password, government identification, or other sensitive information.

## Form Requirements

- Use POST for production submission.
- Every checkbox must have a stable name and value.
- Group related checkboxes with `fieldset` and `legend`.
- Preserve entered values when server validation fails.
- Do not place personal information in the URL.
- Do not rely exclusively on JavaScript.
- Keep client-side validation as an enhancement.
- Provide server-side error messages using the same plain-language wording as the client-side errors.
- Do not redirect to the welcome page until storage succeeds.

## Error Handling

Revised per Dean's JAWS testing; see Decision Log, Decision 011. The linked error summary originally specified below has been removed and replaced with direct focus to the first invalid field, because JAWS testing showed the summary produced a noisy, obstructive recovery path rather than an efficient one.

### Client-Side Errors

The production experience provides:

- Field-level messages, connected to their control with `aria-describedby`.
- `aria-invalid="true"` on invalid controls only.
- No error summary and no page-level alert region.
- Focus movement directly to the first invalid control, in document order, after a failed submission.
- Correcting one field clears only that field's own error and never moves focus.

### Server-Side Errors

The production system must return the registration page with:

- A descriptive page title indicating an error.
- Field-level messages connected with `aria-describedby`, using the same plain-language wording as the client-side errors.
- `aria-invalid="true"` on invalid controls only.
- `autofocus` on the first invalid control's input, so a full page load (including with client-side JavaScript unavailable) places focus there without requiring script.
- Preserved non-sensitive values.
- No error summary, no linked list of errors, and no `role="alert"`.
- No loss of entered information after an ordinary validation failure.

### System Failure

When storage or email processing fails:

- Do not display a false success message.
- Provide a clear status explaining that registration was not completed.
- Preserve the submission when safe and possible.
- Provide an alternate contact method.
- Log technical details without exposing them to the visitor.

## Confirmation Requirements

### Confirmation Page

The production confirmation page must:

- Use a unique title.
- Confirm that the registration was received.
- Explain whether email verification is still required.
- Avoid repeating optional personal responses.
- Provide meaningful next destinations.
- Provide a contact method for corrections or deletion.

### Confirmation Email

Suggested subject:

`Welcome to the Open Door Design Community`

The email must confirm receipt, explain next steps, identify the sender, and provide a correction or deletion contact.

## Spam Protection

Preferred first-release controls:

- Hidden honeypot field excluded from the accessibility tree and normal keyboard order.
- Minimum reasonable completion time check.
- Rate limiting by server and network signals.
- Duplicate submission detection.
- Email verification if abuse becomes meaningful.

Do not add a visual puzzle CAPTCHA or an audio CAPTCHA as the default solution.

## Data and Privacy Requirements

- Store only submitted values required for community operation.
- Record registration source as OpenDoorDesign.org Community Registration.
- Record created and updated timestamps.
- Record consent version and timestamp.
- Create a documented deletion process.
- Create a documented correction process.
- Define data retention before public production use.
- Restrict administrative access.
- Encrypt data in transit and rely on an appropriate protected storage service at rest.

## Future Salesforce Mapping

The production data model must be exportable and mappable to Salesforce without changing the public form.

Potential mapping:

- Community Member to Contact or Person Account, depending on future Salesforce architecture.
- Interests to related interest records or controlled multi-select values.
- Accessibility Perspectives to a related child object or controlled values with restricted access.
- Participation Preferences to campaign membership, interest records, or a custom relationship object.
- Consent to an auditable consent record.
- Source to lead or contact source metadata.

No final Salesforce object model is approved in Feature 001.

## Main Website Integration

Status: Complete, with one documented exception.

- [x] Community appears in the agreed primary navigation position (after Join the Journey / Follow the Journey, before Accessibility Commitment) on every page that carries the shared navigation, except `Inquiries-OpenDoorDesign.html`, which uses a different, apparently orphaned navigation structure — see Decision Log, Decision 009.
- [x] The Community home page invites participation before presenting the registration link.
- [x] The Community pages use the same header, navigation, footer, typography, focus treatment, and CSS files as the main website, plus one supplemental stylesheet (`community/assets/community.css`) limited to form and error styling built on the shared design tokens.
- [x] Relative paths verified from both root pages and Community pages.
- [x] Community's own navigation link carries `aria-current="page"` only on `community/index.html`, matching the pattern used elsewhere on the site (a nav item is only marked current on the exact page it links to).
- [x] All page titles remain unique.

## Implementation Order

1. Integrate the Community pages into the complete site design and navigation.
2. Finalize field names, values, and privacy notice version.
3. Select the first production hosting and data-storage approach.
4. Build the secure POST endpoint.
5. Add server-side validation and persistence.
6. Add accessible success and failure responses.
7. Add confirmation email delivery.
8. Add spam controls.
9. Complete privacy and security review.
10. Test with assistive technologies and mobile browsers.
11. Launch with monitoring and a rollback plan.

## Acceptance Criteria

Feature 001 is complete only when:

- Community is reachable from every intended public page.
- Required and optional fields match this specification.
- All controls have stable names and labels.
- The form works without client-side JavaScript.
- Invalid submissions produce an accessible error summary and field errors.
- Valid information is transmitted by HTTPS POST.
- The server validates all fields.
- A successful registration is stored securely.
- Consent version and timestamp are recorded.
- A duplicate or repeated submission has defined behavior.
- The visitor receives an accurate confirmation page.
- The visitor receives a confirmation email or a clearly documented pending-verification message.
- No personal data appears in the URL.
- No inaccessible CAPTCHA is used.
- Privacy, correction, deletion, and retention procedures are documented.
- JAWS, NVDA, VoiceOver, keyboard-only, zoom, and mobile testing are completed and recorded.

## Testing Checklist

### Screen Reader

- Page title identifies the page and state.
- H1 identifies the page.
- Region navigation (Insert+B in JAWS) exposes only Banner, Primary navigation, Main, and Footer on Community pages — no region per heading.
- Heading navigation remains meaningful without relying on region navigation.
- Form groups and legends are meaningful.
- Required status is announced.
- Hints and errors are associated correctly.
- No checkbox or other control is duplicated in the DOM.
- On a failed submission, focus moves directly to the first invalid control, not to a summary or landmark.
- The focused invalid control announces its label, required state, invalid state, and connected error message together.
- No error text is announced repeatedly without the visitor taking an action.
- Confirmation is announced through ordinary document structure.

Completed 2026-07-30 (server-side validation and rendering logic): all-empty submission, first-name-only submission, malformed-email submission, missing-privacy-confirmation submission, correcting one field while others remain invalid, and a fully valid submission. See Decision Log, Decision 011, for what each case verified. Live JAWS testing of the deployed pages by Dean remains the final verification step.

### Keyboard

- All controls are reachable in logical order.
- No keyboard trap exists.
- Space toggles checkboxes.
- Enter submits from appropriate fields.
- Focus remains visible.
- Submission does not cause unexplained focus loss.

### Data and Security

- GET requests cannot create registrations.
- Unsupported field values are rejected.
- Script and markup input is safely handled.
- Personal data is absent from logs where not required.
- Rate limits and spam controls operate without blocking legitimate assistive technology users.
- Backup and deletion procedures are verified.

## Owner Handoff

Open Door Design owns the vision, content, accessibility expectations, acceptance testing, and approval.

Chip owns production implementation after receiving the complete OpenDoorDesign repository and this feature specification.
