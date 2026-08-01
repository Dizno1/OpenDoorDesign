"use strict";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds the Community registration confirmation email in plain-text and
 * accessible HTML versions. Deliberately simple markup: no images, no
 * multi-column layout, no color-only meaning, so the message reads the same
 * whether opened as HTML, as plain text, or through a screen reader —
 * consistent with the Accessibility Baseline in Community Architecture.md.
 *
 * @param {{ firstName: string, email: string }} member
 * @param {{ email: { fromAddress: string } }} config
 */
function renderConfirmationEmail(member, config) {
  const subject = "You're registered for the Open Door Design Community";

  const text = [
    `Hi ${member.firstName},`,
    "",
    "Thank you for registering for the Open Door Design Community. Your registration has been received.",
    "",
    "If anything you submitted needs to be corrected, or if you would like your registration deleted, contact Accessibility@OpenDoorDesign.org.",
    "",
    "— Open Door Design",
    "https://opendoordesign.org"
  ].join("\n");

  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeHtml(subject)}</title>`,
    "</head>",
    "<body>",
    `<p>Hi ${escapeHtml(member.firstName)},</p>`,
    "<p>Thank you for registering for the Open Door Design Community. Your registration has been received.</p>",
    '<p>If anything you submitted needs to be corrected, or if you would like your registration deleted, contact <a href="mailto:Accessibility@OpenDoorDesign.org">Accessibility@OpenDoorDesign.org</a>.</p>',
    '<p>— Open Door Design<br><a href="https://opendoordesign.org">opendoordesign.org</a></p>',
    "</body>",
    "</html>"
  ].join("\n");

  return {
    to: member.email,
    from: config.email.fromAddress,
    subject,
    text,
    html
  };
}

module.exports = { renderConfirmationEmail };
