"use strict";

const crypto = require("crypto");

/**
 * SQLite implementation of the registration storage interface described in
 * registrationStore.js. This is the initial (Feature 001) production data
 * store — see Decision Log, Decision 010.
 */
class SqliteRegistrationStore {
  /**
   * @param {import("better-sqlite3").Database} db
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Used by the health endpoint (server.js) to confirm the database is
   * reachable and responsive. Throws if it is not.
   */
  ping() {
    this.db.prepare("SELECT 1").get();
    return true;
  }

  findByNormalizedEmail(emailNormalized) {
    const row = this.db
      .prepare("SELECT * FROM community_members WHERE email_normalized = ?")
      .get(emailNormalized);
    return row || null;
  }

  createRegistration(input) {
    const now = new Date().toISOString();
    const memberId = crypto.randomUUID();

    const insertMember = this.db.prepare(`
      INSERT INTO community_members
        (id, first_name, last_name, email, email_normalized, about_you, status, source, created_at, updated_at)
      VALUES (@id, @firstName, @lastName, @email, @emailNormalized, @aboutYou, 'pending', 'website_community_registration', @now, @now)
    `);

    const insertInterest = this.db.prepare(`
      INSERT OR IGNORE INTO community_member_interests (community_member_id, interest_id, created_at)
      SELECT ?, id, ? FROM interests WHERE label = ? AND is_active = 1
    `);

    const insertPerspective = this.db.prepare(`
      INSERT OR IGNORE INTO community_member_accessibility_perspectives
        (community_member_id, accessibility_perspective_id, created_at)
      SELECT ?, id, ? FROM accessibility_perspectives WHERE label = ? AND is_active = 1
    `);

    const insertPreference = this.db.prepare(`
      INSERT OR IGNORE INTO community_member_participation_preferences
        (community_member_id, participation_preference_id, created_at)
      SELECT ?, id, ? FROM participation_preferences WHERE label = ? AND is_active = 1
    `);

    const insertConsent = this.db.prepare(`
      INSERT INTO consent_records
        (id, community_member_id, consent_type, notice_version, consent_status, recorded_at, source)
      VALUES (?, ?, 'community_privacy_notice', ?, 'granted', ?, 'website_community_registration')
    `);

    const transaction = this.db.transaction(() => {
      insertMember.run({
        id: memberId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        emailNormalized: input.emailNormalized,
        aboutYou: input.aboutYou || null,
        now
      });

      for (const label of input.interests) {
        insertInterest.run(memberId, now, label);
      }
      for (const label of input.accessibilityPerspectives) {
        insertPerspective.run(memberId, now, label);
      }
      for (const label of input.participationPreferences) {
        insertPreference.run(memberId, now, label);
      }

      insertConsent.run(crypto.randomUUID(), memberId, input.privacyNoticeVersion, now);
    });

    transaction();

    return { id: memberId, createdAt: now };
  }

  recordEvent(event) {
    this.db
      .prepare(`
        INSERT INTO registration_events (id, community_member_id, event_type, result, created_at, correlation_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        crypto.randomUUID(),
        event.communityMemberId || null,
        event.eventType,
        event.result,
        new Date().toISOString(),
        event.correlationId
      );
  }
}

module.exports = { SqliteRegistrationStore };
