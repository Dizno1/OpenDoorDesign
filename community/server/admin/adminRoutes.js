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

const { initializeReview, getMember, listPage, detailPage, validToken } = require("./memberReview");
const { sendDailyDigest } = require("./dailyDigest");
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
function createAdminRouter(config, store, emailProvider) {
  const router = express.Router();
  const requireAdmin = createAdminAuthMiddleware(config);

  router.use(requireAdmin);
  initializeReview(store.db);
  router.get("/members", (req,res) => {
    const offset = /^\d+$/.test(String(req.query.offset||"0")) ? Math.min(1000000,Number(req.query.offset||0)) : 0;
    res.set("Cache-Control","no-store").type("html").send(listPage(store.db,offset));
  });
  router.get("/members/:id", (req,res) => {
    const member=getMember(store.db,req.params.id);
    if(!member)return res.status(404).type("text").send("Member not found.");
    res.set("Cache-Control","no-store").type("html").send(detailPage(member,config.admin.password));
  });
  router.post("/members/:id/review", (req,res) => {
    const member=getMember(store.db,req.params.id);
    if(!member)return res.status(404).type("text").send("Member not found.");
    if(!validToken(config.admin.password,req.params.id,req.body.token))return res.status(403).type("text").send("Invalid review request.");
    store.db.prepare("INSERT OR IGNORE INTO community_admin_reviews (community_member_id,reviewed_at) VALUES (?,?)").run(member.id,new Date().toISOString());
    res.redirect(303,"/community/admin/members/"+encodeURIComponent(member.id));
  });
  // Invoke once daily from an authenticated external scheduler at 08:00 Eastern.
  // Never run automatically on every application instance or registration.
  router.post("/digest/run", async (req,res) => {
    try {
      const result=await sendDailyDigest({db:store.db,provider:emailProvider,config});
      res.set("Cache-Control","no-store").json(result);
    } catch(error) {
      console.error("[community-digest]",error);
      res.status(503).json({status:"failed"});
    }
  });

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