"use strict";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMemberSignInEmail(member, signInUrl, config) {
  const firstName = String(member.firstName || "").trim();
  const safeFirstName = escapeHtml(firstName);
  const safeUrl = escapeHtml(signInUrl);

  const greeting = firstName ? `Hello ${firstName},` : "Hello,";

  const text = [
    greeting,
    "",
    "Use the secure link below to sign in to your Open Door Design Community Dashboard:",
    "",
    signInUrl,
    "",
    "This sign-in link expires in 15 minutes and can be used only once.",
    "",
    "If you did not request this sign-in link, you can ignore this message.",
    "",
    "Open Door Design Community"
  ].join("\n");

  const html = [
    `<p>${safeFirstName ? `Hello ${safeFirstName},` : "Hello,"}</p>`,
    "<p>Use the secure link below to sign in to your Open Door Design Community Dashboard:</p>",
    `<p><a href="${safeUrl}">Sign in to your Community Dashboard</a></p>`,
    "<p>This sign-in link expires in 15 minutes and can be used only once.</p>",
    "<p>If you did not request this sign-in link, you can ignore this message.</p>",
    "<p>Open Door Design Community</p>"
  ].join("");

  return {
    to: member.email,
    from: config.email.fromAddress,
    subject: "Sign in to your Open Door Design Community Dashboard",
    text,
    html
  };
}

module.exports = { renderMemberSignInEmail };