"use strict";

/**
 * Read-only queries for the Community administration area.
 *
 * This module deliberately excludes accessibility-perspective data from
 * ordinary dashboard views and exports. That data is marked as more
 * sensitive in the Community database schema and should only be exposed
 * through a separately designed restricted workflow.
 */

/**
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 */
function getDashboardSummary(store) {
  const db = store.db;

  const totalMembers = db
    .prepare("SELECT COUNT(*) AS count FROM community_members")
    .get().count;

  const statusRows = db
    .prepare(`
      SELECT status, COUNT(*) AS count
      FROM community_members
      GROUP BY status
      ORDER BY status
    `)
    .all();

  const statusCounts = {
    pending: 0,
    active: 0,
    unsubscribed: 0,
    deleted: 0,
    blocked: 0
  };

  for (const row of statusRows) {
    statusCounts[row.status] = row.count;
  }

  const registrationsLast7Days = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM community_members
      WHERE created_at >= datetime('now', '-7 days')
    `)
    .get().count;

  const registrationsLast30Days = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM community_members
      WHERE created_at >= datetime('now', '-30 days')
    `)
    .get().count;

  const confirmationEmailRows = db
    .prepare(`
      SELECT result, COUNT(*) AS count
      FROM registration_events
      WHERE event_type = 'confirmation_email'
      GROUP BY result
      ORDER BY result
    `)
    .all();

  const confirmationEmailResults = {};
  for (const row of confirmationEmailRows) {
    confirmationEmailResults[row.result] = row.count;
  }

  return {
    totalMembers,
    statusCounts,
    registrationsLast7Days,
    registrationsLast30Days,
    confirmationEmailResults
  };
}

/**
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 * @param {number} [limit]
 */
function getRecentMembers(store, limit = 25) {
  return store.db
    .prepare(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        status,
        source,
        created_at,
        updated_at
      FROM community_members
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .all(limit);
}

/**
 * Returns registration counts grouped by UTC calendar day.
 *
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 * @param {number} [days]
 */
function getRegistrationTrend(store, days = 30) {
  return store.db
    .prepare(`
      SELECT
        substr(created_at, 1, 10) AS registration_date,
        COUNT(*) AS count
      FROM community_members
      WHERE created_at >= datetime('now', ?)
      GROUP BY substr(created_at, 1, 10)
      ORDER BY registration_date
    `)
    .all(`-${days} days`);
}

/**
 * Summarizes recorded registration-system events.
 *
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 */
function getEventSummary(store) {
  return store.db
    .prepare(`
      SELECT
        event_type,
        result,
        COUNT(*) AS count,
        MAX(created_at) AS most_recent
      FROM registration_events
      GROUP BY event_type, result
      ORDER BY event_type, result
    `)
    .all();
}

/**
 * Returns recent registration events for operational troubleshooting.
 *
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 * @param {number} [limit]
 */
function getRecentEvents(store, limit = 50) {
  return store.db
    .prepare(`
      SELECT
        re.id,
        re.community_member_id,
        re.event_type,
        re.result,
        re.created_at,
        re.correlation_id,
        cm.first_name,
        cm.last_name,
        cm.email
      FROM registration_events re
      LEFT JOIN community_members cm
        ON cm.id = re.community_member_id
      ORDER BY re.created_at DESC
      LIMIT ?
    `)
    .all(limit);
}

/**
 * Returns ordinary member data suitable for the default admin member list
 * and CSV export.
 *
 * Accessibility perspectives are intentionally excluded.
 *
 * @param {import("../storage/sqliteRegistrationStore").SqliteRegistrationStore} store
 */
function getMembersForAdmin(store) {
  return store.db
    .prepare(`
      SELECT
        cm.id,
        cm.first_name,
        cm.last_name,
        cm.email,
        cm.about_you,
        cm.status,
        cm.source,
        cm.created_at,
        cm.updated_at,

        (
          SELECT GROUP_CONCAT(i.label, '; ')
          FROM community_member_interests cmi
          JOIN interests i
            ON i.id = cmi.interest_id
          WHERE cmi.community_member_id = cm.id
        ) AS interests,

        (
          SELECT GROUP_CONCAT(pp.label, '; ')
          FROM community_member_participation_preferences cmpp
          JOIN participation_preferences pp
            ON pp.id = cmpp.participation_preference_id
          WHERE cmpp.community_member_id = cm.id
        ) AS participation_preferences,

        (
          SELECT cr.consent_status
          FROM consent_records cr
          WHERE cr.community_member_id = cm.id
          ORDER BY cr.recorded_at DESC
          LIMIT 1
        ) AS consent_status,

        (
          SELECT cr.notice_version
          FROM consent_records cr
          WHERE cr.community_member_id = cm.id
          ORDER BY cr.recorded_at DESC
          LIMIT 1
        ) AS consent_notice_version,

        (
          SELECT cr.recorded_at
          FROM consent_records cr
          WHERE cr.community_member_id = cm.id
          ORDER BY cr.recorded_at DESC
          LIMIT 1
        ) AS consent_recorded_at

      FROM community_members cm
      ORDER BY cm.created_at DESC
    `)
    .all();
}

module.exports = {
  getDashboardSummary,
  getRecentMembers,
  getRegistrationTrend,
  getEventSummary,
  getRecentEvents,
  getMembersForAdmin
};