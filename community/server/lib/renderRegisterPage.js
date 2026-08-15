"use strict";

const fs = require("fs");
const path = require("path");

const REGISTER_PAGE_PATH = path.join(__dirname, "..", "templates", "register.html");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Document order defines "the first invalid field," matching community.js.
const FIELD_ORDER = ["first-name", "last-name", "email", "privacy-agreement"];
const FIELD_ERROR_IDS = {
  "first-name": "first-name-error",
  "last-name": "last-name-error",
  "email": "email-error",
  "privacy-agreement": "privacy-error"
};

/**
 * Re-renders the static register.html on the server after a failed
 * submission: a descriptive title, field-level messages connected with
 * aria-describedby, aria-invalid on invalid controls, autofocus on the
 * first invalid control (so a full page load lands focus there without
 * requiring JavaScript), and every non-sensitive entered value preserved.
 *
 * There is no error summary and no alert region. This mirrors the JAWS
 * remediation done in community.js: one stop at the first problem, not a
 * separate landmark or linked list to navigate first. See Feature 001,
 * "Server-Side Errors," and the Decision Log entry for this remediation.
 */
function renderRegisterPageWithErrors(errors, submitted) {
  let html = fs.readFileSync(REGISTER_PAGE_PATH, "utf8");

  html = html.replace(
    "<title>Join the Community - Open Door Design</title>",
    "<title>There is a problem - Join the Community - Open Door Design</title>"
  );

  const byField = new Map(errors.map((error) => [error.field, error.message]));
  const firstInvalidField = FIELD_ORDER.find((fieldId) => byField.has(fieldId));

  FIELD_ORDER.forEach((fieldId) => {
    const errorId = FIELD_ERROR_IDS[fieldId];
    const message = byField.get(fieldId);
    if (!message) return;
    const hiddenPattern = new RegExp(`<p id="${errorId}" class="field-error" hidden></p>`);
    html = html.replace(hiddenPattern, `<p id="${errorId}" class="field-error">${escapeHtml(message)}</p>`);
  });

  FIELD_ORDER.forEach((fieldId) => {
    if (!byField.has(fieldId)) return;
    const isFirst = fieldId === firstInvalidField;
    const inputPattern = new RegExp(`(<input id="${fieldId}"[^>]*)>`);
    html = html.replace(inputPattern, (match, openTag) => {
      const withInvalid = `${openTag} aria-invalid="true"`;
      return `${isFirst ? `${withInvalid} autofocus` : withInvalid}>`;
    });
  });

  html = html.replace(
    /<input id="first-name" name="first_name" type="text" autocomplete="given-name" maxlength="100" required aria-describedby="first-name-error"([^>]*)>/,
    (match) => match.replace('aria-describedby="first-name-error"', `value="${escapeHtml(submitted.firstName || "")}" aria-describedby="first-name-error"`)
  );
  html = html.replace(
    /<input id="last-name" name="last_name" type="text" autocomplete="family-name" maxlength="100" required aria-describedby="last-name-error"([^>]*)>/,
    (match) => match.replace('aria-describedby="last-name-error"', `value="${escapeHtml(submitted.lastName || "")}" aria-describedby="last-name-error"`)
  );
  html = html.replace(
    /<input id="email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="email-hint email-error"([^>]*)>/,
    (match) => match.replace('aria-describedby="email-hint email-error"', `value="${escapeHtml(submitted.email || "")}" aria-describedby="email-hint email-error"`)
  );
  html = html.replace(
    /<textarea id="about-you" name="about_you" rows="6" maxlength="2000" aria-describedby="about-you-hint"><\/textarea>/,
    `<textarea id="about-you" name="about_you" rows="6" maxlength="2000" aria-describedby="about-you-hint">${escapeHtml(submitted.aboutYou || "")}</textarea>`
  );

  const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  (submitted.interests || []).forEach((value) => {
    const pattern = new RegExp(`(<input type="checkbox" name="interests" value="${escapeForRegex(value)}")`);
    html = html.replace(pattern, "$1 checked");
  });
  (submitted.accessibilityPerspectives || []).forEach((value) => {
    const pattern = new RegExp(`(<input type="checkbox" name="accessibility_perspectives" value="${escapeForRegex(value)}")`);
    html = html.replace(pattern, "$1 checked");
  });
  (submitted.participationPreferences || []).forEach((value) => {
    const pattern = new RegExp(`(<input type="checkbox" name="participation_preferences" value="${escapeForRegex(value)}")`);
    html = html.replace(pattern, "$1 checked");
  });

  return html;
}

module.exports = { renderRegisterPageWithErrors };
