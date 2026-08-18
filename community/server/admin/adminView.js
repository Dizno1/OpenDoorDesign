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
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(count)}</li>`
    )
    .join("\n");
}

function renderEmailResults(results) {
  const entries = Object.entries(results || {});

  if (entries.length === 0) {
    return "<p>No confirmation email events have been recorded yet.</p>";
  }

  return [
    "<ul>",
    ...entries.map(
      ([result, count]) =>
        `<li><strong>${escapeHtml(result)}:</strong> ${escapeHtml(count)}</li>`
    ),
    "</ul>"
  ].join("\n");
}

function renderRegistrationTrend(rows) {
  if (!rows || rows.length === 0) {
    return "<p>No registrations were recorded during this period.</p>";
  }

  return [
    '<table>',
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
        `<tr><td>${escapeHtml(row.registration_date)}</td><td>${escapeHtml(row.count)}</td></tr>`
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
    '<table>',
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
      const name = `${row.first_name || ""} ${row.last_name || ""}`.trim();

      return [
        "<tr>",
        `<td>${escapeHtml(name)}</td>`,
        `<td><a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a></td>`,
        `<td>${escapeHtml(row.status)}</td>`,
        `<td>${escapeHtml(row.source)}</td>`,
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
    '<table>',
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
          `<td>${escapeHtml(row.event_type)}</td>`,
          `<td>${escapeHtml(row.result)}</td>`,
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
    '<table>',
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
      const memberName = `${row.first_name || ""} ${row.last_name || ""}`.trim();
      const member = row.email
        ? `${memberName ? `${memberName} — ` : ""}${row.email}`
        : "No member record";

      return [
        "<tr>",
        `<td>${escapeHtml(formatDate(row.created_at))}</td>`,
        `<td>${escapeHtml(member)}</td>`,
        `<td>${escapeHtml(row.event_type)}</td>`,
        `<td>${escapeHtml(row.result)}</td>`,
        `<td><code>${escapeHtml(row.correlation_id)}</code></td>`,
        "</tr>"
      ].join("");
    }),
    "</tbody>",
    "</table>"
  ].join("\n");
}

/**
 * Renders the first Community administration dashboard.
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
  <style>
    body {
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }

    header,
    main,
    footer {
      max-width: 80rem;
      margin: 0 auto;
      padding: 1rem;
    }

    nav ul {
      padding-left: 1.25rem;
    }

    section {
      margin-block: 2rem;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    caption {
      font-weight: 700;
      text-align: left;
      padding-block: 0.5rem;
    }

    th,
    td {
      border: 1px solid currentColor;
      padding: 0.5rem;
      text-align: left;
      vertical-align: top;
    }

    .summary-list {
      list-style: none;
      padding-left: 0;
    }

    .notice {
      border: 2px solid currentColor;
      padding: 1rem;
    }

    .table-scroll {
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <header>
    <h1>Open Door Design Community Administration</h1>
    <p>Operational view of Community registration activity and member data.</p>
  </header>

  <main id="main">
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading">Community summary</h2>
      <ul class="summary-list">
        <li><strong>Total registrations:</strong> ${escapeHtml(summary.totalMembers)}</li>
        <li><strong>Registrations in the last 7 days:</strong> ${escapeHtml(summary.registrationsLast7Days)}</li>
        <li><strong>Registrations in the last 30 days:</strong> ${escapeHtml(summary.registrationsLast30Days)}</li>
      </ul>

      <h3>Member status</h3>
      <ul>
        ${renderStatusSummary(summary.statusCounts)}
      </ul>

      <h3>Confirmation email results</h3>
      ${renderEmailResults(summary.confirmationEmailResults)}
    </section>

    <section aria-labelledby="trend-heading">
      <h2 id="trend-heading">Registration activity</h2>
      <div class="table-scroll">
        ${renderRegistrationTrend(registrationTrend)}
      </div>
    </section>

    <section aria-labelledby="members-heading">
      <h2 id="members-heading">Recent registrations</h2>
      <p>This table shows the 25 most recent Community registrations.</p>
      <div class="table-scroll">
        ${renderRecentMembers(recentMembers)}
      </div>
    </section>

    <section aria-labelledby="events-heading">
      <h2 id="events-heading">Registration system events</h2>
      <div class="table-scroll">
        ${renderEventSummary(eventSummary)}
      </div>

      <h3>Recent event history</h3>
      <div class="table-scroll">
        ${renderRecentEvents(recentEvents)}
      </div>
    </section>

    <section class="notice" aria-labelledby="privacy-heading">
      <h2 id="privacy-heading">Administrative privacy note</h2>
      <p>This default dashboard intentionally does not display accessibility-perspective responses. The Community database identifies those responses as more sensitive than ordinary registration information.</p>
    </section>
  </main>

  <footer>
    <p>Open Door Design Community administration.</p>
  </footer>
</body>
</html>`;
}

module.exports = { renderAdminDashboard };