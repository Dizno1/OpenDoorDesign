# Community Email Service

## Current state

Only one provider is implemented: `consoleEmailProvider.js`, which logs the
email it would send and always returns `{ sent: false }`. No commercial
email provider is configured, hard-coded, or contacted by this codebase.

## How this is wired together

- `templates/confirmationEmail.js` builds the message (subject, plain-text
  body, and accessible HTML body) from a member's first name and email.
- `emailProvider.js` documents the interface every provider must implement:
  a single `async send(message)` method returning `{ sent, provider, detail }`.
- `emailService.js` reads `config.email.provider` (from the `EMAIL_PROVIDER`
  environment variable, via `../config.js`) and selects a provider. Today
  that is always `ConsoleEmailProvider`.
- `../server.js` calls `sendConfirmationEmail` after a registration is
  successfully stored, and records the outcome as a `registration_events`
  row. A failure here is logged and recorded but never undoes the
  registration or changes the response the visitor sees, since storage
  already succeeded.

## Adding a real provider later

1. Create a new file in this folder (for example `postmarkEmailProvider.js`)
   implementing the same `async send(message)` interface described in
   `emailProvider.js`.
2. Have that file read its own credential from its own environment variable
   (for example `EMAIL_PROVIDER_API_KEY`), never from a hard-coded value and
   never from a file committed to the repository.
3. Add a `case` for the provider's name in `emailService.js`'s
   `getEmailProvider` function.
4. Set `EMAIL_PROVIDER` to that name, and the provider's credential
   variable, in the deployment environment (see `../.env.example`).

No change to `server.js`, `templates/confirmationEmail.js`, or any HTML page
is required to add a provider, because every provider implements the same
interface and is selected in exactly one place.
