"use strict";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short"
  });
}

function formatEventType(value) {
  const labels = {
    confirmation_email: "Confirmation email",
    registration_submitted: "Registration submitted"
  };

  return labels[value] || value;
}

function formatEventResult(value) {
  const labels = {
    sent: "Sent",
    stored: "Stored",
    failed: "Failed",
    storage_failure: "Storage failure",
    duplicate_active_member: "Duplicate registration, active member",
    duplicate_pending_member: "Duplicate registration, pending member",
    not_sent_console: "Not sent, development console provider"
  };

  return labels[value] || value;
}

function formatSource(value) {
  const labels = {
    website_community_registration: "Community registration website"
  };

  return labels[value] || value;
}

function renderStatusSummary(statusCounts) {
  const statuses = [
    ["Pending", statusCounts.pending || 0],
    ["Active", statusCounts.active || 0],
    ["Unsubscribed", statusCounts.unsubscribed || 0],
    ["Deleted", statusCounts.deleted || 0],
    ["Blocked", statusCounts.blocked || 0]
  ];

  return statuses
    .map(
      ([label, count]) =>
        `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(count)}</dd>`
    )
    .join("\n");
}

function renderEmailResults(results) {
  const entries = Object.entries(results || {});

  if (entries.length === 0) {
    return "<p>No confirmation email events have been recorded yet.</p>";
  }

  return [
    '<dl class="kvl">',
    ...entries.map(
      ([result, count]) =>
        `<dt>${escapeHtml(formatEventResult(result))}</dt><dd>${escapeHtml(count)}</dd>`
    ),
    "</dl>"
  ].join("\n");
}

function renderRegistrationTrend(rows) {
  if (!rows || rows.length === 0) {
    return "<p>No registrations were recorded during this period.</p>";
  }

  return [
    "<table>",
    "<caption>Registrations by day for the last 30 days</caption>",
    "<thead>",
    "<tr>",
    '<th scope="col">Date</th>',
    '<th scope="col">Registrations</th>',
    "</tr>",
    "</thead>",
    "<tbody>",
    ...rows.map(
      (row) =>
        [
          "<tr>",
          `<th scope="row">${escapeHtml(row.registration_date)}</th>`,
          `<td>${escapeHtml(row.count)}</td>`,
          "</tr>"
        ].join("")
    ),
    "</tbody>",
    "</table>"
  ].join("\n");
}

function renderRecentMembers(rows) {
  if (!rows || rows.length === 0) {
    return "<p>No Community members have registered yet.</p>";
  }

  return [
    "<table>",
    "<caption>Most recent Community registrations</caption>",
    "<thead>",
    "<tr>",
    '<th scope="col">Name</th>',
    '<th scope="col">Email</th>',
    '<th scope="col">Status</th>',
    '<th scope="col">Source</th>',
    '<th scope="col">Registered</th>',
    "</tr>",
    "</thead>",
    "<tbody>",
    ...rows.map((row) => {
      const name =
        `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
        "Name not available";

      return [
        "<tr>",
        `<th scope="row">${escapeHtml(name)}</th>`,
        `<td><a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a></td>`,
        `<td>${escapeHtml(row.status)}</td>`,
        `<td>${escapeHtml(formatSource(row.source))}</td>`,
        `<td>${escapeHtml(formatDate(row.created_at))}</td>`,
        "</tr>"
      ].join("");
    }),
    "</tbody>",
    "</table>"
  ].join("\n");
}

function renderEventSummary(rows) {
  if (!rows || rows.length === 0) {
    return "<p>No registration events have been recorded yet.</p>";
  }

  return [
    "<table>",
    "<caption>Registration system event summary</caption>",
    "<thead>",
    "<tr>",
    '<th scope="col">Event</th>',
    '<th scope="col">Result</th>',
    '<th scope="col">Count</th>',
    '<th scope="col">Most recent</th>',
    "</tr>",
    "</thead>",
    "<tbody>",
    ...rows.map(
      (row) =>
        [
          "<tr>",
          `<th scope="row">${escapeHtml(formatEventType(row.event_type))}</th>`,
          `<td>${escapeHtml(formatEventResult(row.result))}</td>`,
          `<td>${escapeHtml(row.count)}</td>`,
          `<td>${escapeHtml(formatDate(row.most_recent))}</td>`,
          "</tr>"
        ].join("")
    ),
    "</tbody>",
    "</table>"
  ].join("\n");
}

function renderRecentEvents(rows) {
  if (!rows || rows.length === 0) {
    return "<p>No recent events are available.</p>";
  }

  return [
    "<table>",
    "<caption>Most recent registration system events</caption>",
    "<thead>",
    "<tr>",
    '<th scope="col">Time</th>',
    '<th scope="col">Member</th>',
    '<th scope="col">Event</th>',
    '<th scope="col">Result</th>',
    '<th scope="col">Correlation ID</th>',
    "</tr>",
    "</thead>",
    "<tbody>",
    ...rows.map((row) => {
      const memberName =
        `${row.first_name || ""} ${row.last_name || ""}`.trim();

      const member = row.email
        ? `${memberName ? `${memberName} — ` : ""}${row.email}`
        : "No member record";

      return [
        "<tr>",
        `<th scope="row">${escapeHtml(formatDate(row.created_at))}</th>`,
        `<td>${escapeHtml(member)}</td>`,
        `<td>${escapeHtml(formatEventType(row.event_type))}</td>`,
        `<td>${escapeHtml(formatEventResult(row.result))}</td>`,
        `<td><code>${escapeHtml(row.correlation_id)}</code></td>`,
        "</tr>"
      ].join("");
    }),
    "</tbody>",
    "</table>"
  ].join("\n");
}

/**
 * Renders the Community administration dashboard using the established
 * Open Door Design page structure and shared design system.
 *
 * Accessibility-perspective data is intentionally not included in this
 * default administrative view because the database schema marks it as more
 * sensitive than ordinary Community registration information.
 *
 * @param {{
 *   summary: object,
 *   recentMembers: object[],
 *   registrationTrend: object[],
 *   eventSummary: object[],
 *   recentEvents: object[]
 * }} data
 */
function renderAdminDashboard(data) {
  const {
    summary,
    recentMembers,
    registrationTrend,
    eventSummary,
    recentEvents
  } = data;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Community Administration - Open Door Design</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Private administration for the Open Door Design Community.">
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="https://opendoordesign.org/css/odd-theme.css?v=20260708-home-dino">
  <link rel="stylesheet" href="https://opendoordesign.org/css/odd-layout.css?v=20260717-skip-links">
  <link rel="stylesheet" href="https://opendoordesign.org/css/odd-components.css?v=20260708-home-dino">
  <link rel="stylesheet" href="https://opendoordesign.org/css/odd-utilities.css?v=20260708-home-dino">
  <link rel="stylesheet" href="https://opendoordesign.org/community/assets/community.css?v=20260730-feature-001">
</head>
<body>
  <div class="skip-links">
    <a href="#main">Skip to main content</a>
    <a href="#primary-navigation">Skip to primary navigation</a>
    <a href="#footer">Skip to footer</a>
  </div>

  <header class="banner" aria-labelledby="banner-name">
    <span id="banner-name" class="visually-hidden">Banner</span>
    <div class="topbar" role="none">
      <a class="home-link" href="https://opendoordesign.org/">
        <img src="https://opendoordesign.org/dino_home_wave.png" alt="Dino waves you home.">
      </a>
    </div>
  </header>

  <div class="brand-center">
    <span class="logo-wrap">
      <img src="https://opendoordesign.org/ODD-FullLogo-StandingDino-DoorwayV2.png" alt="Open Door Design logo with a dinosaur mascot standing in a doorway that represents accessible entry into digital and physical spaces.">
    </span>
  </div>

  <nav id="primary-navigation" class="primary-nav" aria-labelledby="primary-nav-name">
    <span id="primary-nav-name" class="visually-hidden">Primary navigation</span>
    <ul role="list" class="nav-list">
      <li role="listitem"><a href="https://opendoordesign.org/">Home</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/OurStory-OpenDoorDesign.html">Our Story</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/AccessibilityAcademy-OpenDoorDesign.html">Accessibility Academy</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/InnovationLab-OpenDoorDesign.html">Innovation Lab</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/CurrentInitiatives-OpenDoorDesign.html">Current Initiatives</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/JoinTheJourney-OpenDoorDesign.html">Join the Journey</a>
      <a href="https://opendoordesign.org/FollowTheJourney-OpenDoorDesign.html">Follow the Journey</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/community/" aria-current="location">Community</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/Accessibility-OpenDoorDesign.html">Accessibility Commitment</a></li>
      <li role="listitem"><a href="https://opendoordesign.org/Contact-OpenDoorDesign.html">Contact</a></li>
    </ul>
  </nav>

  <main id="main" tabindex="-1">
    <section class="section">
      <h1>Community Administration</h1>
      <p class="lede">Private operational view of Open Door Design Community registration activity and member data.</p>
    </section>

    <section class="section">
      <h2>Administration actions</h2>
      <p><a class="button" href="/community/admin/members.csv">Download member data as CSV</a></p>
      <p>The member export contains ordinary Community registration data, interests, participation preferences, and consent information. Accessibility-perspective responses are not included.</p>
    </section>

    <section class="section">
      <h2>Community summary</h2>

      <dl class="kvl">
        <dt>Total registrations</dt>
        <dd>${escapeHtml(summary.totalMembers)}</dd>

        <dt>Registrations in the last 7 days</dt>
        <dd>${escapeHtml(summary.registrationsLast7Days)}</dd>

        <dt>Registrations in the last 30 days</dt>
        <dd>${escapeHtml(summary.registrationsLast30Days)}</dd>
      </dl>

      <h3>Member status</h3>
      <dl class="kvl">
        ${renderStatusSummary(summary.statusCounts)}
      </dl>

      <h3>Confirmation email results</h3>
      ${renderEmailResults(summary.confirmationEmailResults)}
    </section>

    <section class="section">
      <h2>Registration activity</h2>
      ${renderRegistrationTrend(registrationTrend)}
    </section>

    <section class="section">
      <h2>Recent registrations</h2>
      <p>This table shows the 25 most recent Community registrations.</p>
      ${renderRecentMembers(recentMembers)}
    </section>

    <section class="section">
      <h2>Registration system events</h2>
      <p>The summary below shows how the registration system has been operating, including successful registrations, duplicate submissions, confirmation email results, and recorded failures.</p>
      ${renderEventSummary(eventSummary)}

      <h3>Recent event history</h3>
      ${renderRecentEvents(recentEvents)}
    </section>

    <section class="section">
      <div class="callout">
        <h2>Administrative privacy note</h2>
        <p>This default dashboard intentionally does not display accessibility-perspective responses. The Community database identifies those responses as more sensitive than ordinary registration information.</p>
      </div>
    </section>
  </main>

  <footer id="footer" role="contentinfo" aria-labelledby="footer-name">
    <span id="footer-name" class="visually-hidden">Footer</span>
    <p><a href="https://opendoordesign.org/Accessibility-OpenDoorDesign.html">Read the Open Door Design Accessibility Commitment</a></p>
    <p><a href="mailto:Accessibility@OpenDoorDesign.org">Accessibility@OpenDoorDesign.org</a> | <a href="mailto:Info@OpenDoorDesign.org">Info@OpenDoorDesign.org</a> | <a href="mailto:Inquiries@OpenDoorDesign.org">Inquiries@OpenDoorDesign.org</a></p>
    <p>Open Door Design is in its founding season. Every page represents ideas in motion, work in progress, and opportunities for collaboration.</p>
  </footer>
</body>
</html>`;
}

module.exports = { renderAdminDashboard };