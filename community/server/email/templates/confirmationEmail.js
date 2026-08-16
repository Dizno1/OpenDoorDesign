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
 * whether opened as HTML, as plain text, or through a screen reader.
 *
 * @param {{ firstName: string, email: string }} member
 * @param {{ email: { fromAddress: string } }} config
 */
function renderConfirmationEmail(member, config) {
  const subject = "Welcome to the Open Door Design Community";

  const text = [
    `Hi ${member.firstName},`,
    "",
    "Thank you for joining the Open Door Design Community. Your registration has been received.",
    "",
    "What you can do now",
    "",
    "Start with the Community Dashboard to see the areas of the Community that are available now:",
    "https://opendoordesign.org/community/dashboard.html",
    "",
    "You can begin participating by exploring Open Door Design projects, following new work as it develops, using the Accessibility Academy and Innovation Lab, reviewing Community resources and downloads, and watching for research and collaboration opportunities.",
    "",
    "You do not need to wait for new Community features to contribute. You can help now by sharing accessibility feedback, testing ideas and tools with your own technology and experience, suggesting improvements, participating in research when opportunities open, and telling us what would make the Community more useful and welcoming.",
    "",
    "What is coming",
    "",
    "The Community is still being built. As it grows, we plan to add real sign-in, personal profiles and profile management, Community activity, discussions, and additional ways for members to participate and connect around shared interests, experiences, research, and projects.",
    "",
    "Open Door Design is being built with the people it is meant to serve. Your experience, questions, ideas, and perspective can help determine what gets built next.",
    "",
    "Keep Community email out of spam or junk",
    "",
    "Community messages are sent from Collaborate@community.opendoordesign.org. Add this address to your contacts or safe senders list. If this message arrived in spam or junk, mark it as not spam or not junk.",
    "",
    "Get in touch",
    "",
    "Community questions and ideas: Info@OpenDoorDesign.org",
    "Research, collaboration, partnerships, and other inquiries: Inquiries@OpenDoorDesign.org",
    "Accessibility questions or problems using Open Door Design: Accessibility@OpenDoorDesign.org",
    "",
    "If information you submitted needs to be corrected, or if you would like your registration deleted, contact Info@OpenDoorDesign.org.",
    "",
    "— Open Door Design",
    "https://opendoordesign.org/community/"
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
    "<p>Thank you for joining the Open Door Design Community. Your registration has been received.</p>",
    "<h2>What you can do now</h2>",
    '<p>Start with the <a href="https://opendoordesign.org/community/dashboard.html">Community Dashboard</a> to see the areas of the Community that are available now.</p>',
    "<p>You can begin participating by exploring Open Door Design projects, following new work as it develops, using the Accessibility Academy and Innovation Lab, reviewing Community resources and downloads, and watching for research and collaboration opportunities.</p>",
    "<p>You do not need to wait for new Community features to contribute. You can help now by sharing accessibility feedback, testing ideas and tools with your own technology and experience, suggesting improvements, participating in research when opportunities open, and telling us what would make the Community more useful and welcoming.</p>",
    "<h2>What is coming</h2>",
    "<p>The Community is still being built. As it grows, we plan to add real sign-in, personal profiles and profile management, Community activity, discussions, and additional ways for members to participate and connect around shared interests, experiences, research, and projects.</p>",
    "<p>Open Door Design is being built with the people it is meant to serve. Your experience, questions, ideas, and perspective can help determine what gets built next.</p>",
    "<h2>Keep Community email out of spam or junk</h2>",
    '<p>Community messages are sent from <a href="mailto:Collaborate@community.opendoordesign.org">Collaborate@community.opendoordesign.org</a>. Add this address to your contacts or safe senders list. If this message arrived in spam or junk, mark it as not spam or not junk.</p>',
    "<h2>Get in touch</h2>",
    '<p>Community questions and ideas: <a href="mailto:Info@OpenDoorDesign.org">Info@OpenDoorDesign.org</a><br>',
    'Research, collaboration, partnerships, and other inquiries: <a href="mailto:Inquiries@OpenDoorDesign.org">Inquiries@OpenDoorDesign.org</a><br>',
    'Accessibility questions or problems using Open Door Design: <a href="mailto:Accessibility@OpenDoorDesign.org">Accessibility@OpenDoorDesign.org</a></p>',
    '<p>If information you submitted needs to be corrected, or if you would like your registration deleted, contact <a href="mailto:Info@OpenDoorDesign.org">Info@OpenDoorDesign.org</a>.</p>',
    '<p>— Open Door Design<br><a href="https://opendoordesign.org/community/">Open Door Design Community</a></p>',
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