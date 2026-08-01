"use strict";

/**
 * Email provider interface.
 *
 * Every provider (the development ConsoleEmailProvider, and any real
 * provider added later) must implement:
 *
 * async send(message: EmailMessage): Promise<EmailResult>
 *
 * EmailMessage fields (see templates/confirmationEmail.js):
 *   to, from, subject, text, html
 *
 * EmailResult fields:
 *   sent: boolean — true only if the provider genuinely attempted delivery
 *     through a real transport. The development provider always returns
 *     false, because it never delivers anything.
 *   provider: string — the provider's own name, for logging.
 *   detail: string — a short human-readable note (never a stack trace or
 *     secret value).
 *
 * emailService.js is the only place a provider is selected (mirroring
 * storage/index.js for the registration store). A real provider — for
 * example one built on a transactional email API — would be added as a new
 * file in this folder implementing the same interface, selected by the
 * EMAIL_PROVIDER environment variable, and would read its own credential
 * from its own environment variable (for example EMAIL_PROVIDER_API_KEY).
 * No provider name or credential is hard-coded anywhere else in this
 * backend.
 */

module.exports = {};
