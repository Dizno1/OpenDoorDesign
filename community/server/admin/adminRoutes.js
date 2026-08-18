"use strict";

const express = require("express");

const {
  getDashboardSummary,
  getRecentMembers,
  getRegistrationTrend,
  getEventSummary,
  getRecentEvents,
  getMembersForAdmin
} = require("./adminQueries");

const { renderAdminDashboard } = require("./adminView");
const { createAdminAuthMiddleware } = require("./adminAuth");

function escapeCsvValue(value) {
  let text = String(value ?? "");

  // Prevent spreadsheet applications such as Excel from interpreting
  // exported member data as formulas.
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildMembersCsv(rows) {
  const headers = [
    "id",
    "first_name",
    "last_name",
    "email",
    "about_you",
    "status",
    "source",
    "created_at",
    "updated_at",
    "interests",
    "participation_preferences",
    "consent_status",
    "consent_notice_version",
    "consent_recorded_at"
  ];

  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(
      headers
        .map((header) => escapeCsvValue(row[header]))
        .join(",")
    );
  }

  return lines.join("\r\n");
}

/**
 * Creates the authenticated Community administration router.
 *
 * This router is not mounted unless the application explicitly enables it.
 *
 * @param {object} config
 * @param {object} store
 */
function createAdminRouter(config, store) {
  const router = express.Router();
  const requireAdmin = createAdminAuthMiddleware(config);

  router.use(requireAdmin);

  router.get("/", (request, response) => {
    const data = {
      summary: getDashboardSummary(store),
      recentMembers: getRecentMembers(store, 25),
      registrationTrend: getRegistrationTrend(store, 30),
      eventSummary: getEventSummary(store),
      recentEvents: getRecentEvents(store, 50)
    };

    response
      .status(200)
      .type("html")
      .send(renderAdminDashboard(data));
  });

  router.get("/members.csv", (request, response) => {
    const rows = getMembersForAdmin(store);
    const csv = buildMembersCsv(rows);

    response.set(
      "Content-Disposition",
      'attachment; filename="community-members.csv"'
    );

    response
      .status(200)
      .type("text/csv")
      .send(csv);
  });

  return router;
}

module.exports = {
  createAdminRouter
};