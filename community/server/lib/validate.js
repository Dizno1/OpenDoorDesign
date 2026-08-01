"use strict";

const ALLOWED_INTERESTS = [
  "Accessibility education",
  "Accessibility engineering",
  "Screen reader testing",
  "Document accessibility",
  "Web and mobile accessibility",
  "Media accessibility",
  "Artificial intelligence",
  "Research and collaboration"
];

const ALLOWED_PERSPECTIVES = [
  "Screen reader user",
  "Keyboard-first user",
  "Low vision or magnification user",
  "Voice input user",
  "Deaf or hard of hearing",
  "Cognitive accessibility",
  "Accessibility professional",
  "Developer or designer learning accessibility",
  "Prefer not to say"
];

const ALLOWED_PARTICIPATION = [
  "Learn through the Academy",
  "Test Innovation Lab projects",
  "Share accessibility feedback",
  "Join research studies",
  "Volunteer",
  "Explore partnerships",
  "Receive project updates"
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function keepAllowed(values, allowedList) {
  const allowedSet = new Set(allowedList);
  return asArray(values).filter((value) => allowedSet.has(value));
}

/**
 * Validates a submitted registration. Every message here uses the same
 * plain-language wording as community.js so a person sees the same error
 * whether JavaScript caught it or the server did (Feature 001, "Server-Side
 * Errors").
 *
 * @param {Record<string, unknown>} body Parsed form submission (application/x-www-form-urlencoded).
 * @returns {{ valid: boolean, errors: {field: string, message: string}[], value: object }}
 */
function validateRegistration(body) {
  const errors = [];

  const firstName = String(body.first_name || "").trim();
  const lastName = String(body.last_name || "").trim();
  const email = String(body.email || "").trim();
  const aboutYou = String(body.about_you || "").trim();
  const privacyConsent = body.privacy_consent === "agreed";
  const privacyNoticeVersion = String(body.privacy_notice_version || "").trim();

  if (!firstName) {
    errors.push({ field: "first-name", message: "Enter your first name." });
  } else if (firstName.length > 100) {
    errors.push({ field: "first-name", message: "First name must be 100 characters or fewer." });
  }

  if (!lastName) {
    errors.push({ field: "last-name", message: "Enter your last name." });
  } else if (lastName.length > 100) {
    errors.push({ field: "last-name", message: "Last name must be 100 characters or fewer." });
  }

  if (!email) {
    errors.push({ field: "email", message: "Enter your email address." });
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    errors.push({ field: "email", message: "Enter an email address in a valid format." });
  }

  if (aboutYou.length > 2000) {
    errors.push({ field: "about-you", message: "Tell us about yourself in 2,000 characters or fewer." });
  }

  if (!privacyConsent || !privacyNoticeVersion) {
    errors.push({
      field: "privacy-agreement",
      message: "Confirm that you have read the Community Privacy Notice."
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      firstName,
      lastName,
      email,
      emailNormalized: email.toLowerCase(),
      aboutYou,
      interests: keepAllowed(body.interests, ALLOWED_INTERESTS),
      accessibilityPerspectives: keepAllowed(body.accessibility_perspectives, ALLOWED_PERSPECTIVES),
      participationPreferences: keepAllowed(body.participation_preferences, ALLOWED_PARTICIPATION),
      privacyConsent,
      privacyNoticeVersion
    }
  };
}

/**
 * Spam-control checks that must never block a legitimate assistive
 * technology user (Feature 001, "Spam Protection" and Decision 008).
 * Both are advisory-only: a missing timing field (JavaScript disabled)
 * fails open rather than rejecting a genuine no-JS submission.
 */
function checkSpamSignals(body) {
  const honeypotFilled = String(body.middle_name || "").trim().length > 0;
  if (honeypotFilled) {
    return { suspicious: true, reason: "honeypot_filled" };
  }

  const renderedAt = Number(body.form_rendered_at);
  if (renderedAt) {
    const elapsedMs = Date.now() - renderedAt;
    if (elapsedMs >= 0 && elapsedMs < 1500) {
      return { suspicious: true, reason: "submitted_too_quickly" };
    }
  }

  return { suspicious: false, reason: null };
}

module.exports = {
  validateRegistration,
  checkSpamSignals,
  ALLOWED_INTERESTS,
  ALLOWED_PERSPECTIVES,
  ALLOWED_PARTICIPATION
};
