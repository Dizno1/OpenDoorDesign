"use strict";

const crypto = require("crypto");

class MemberAccessStore {
  constructor(db) {
    this.db = db;
  }

  findMemberByNormalizedEmail(emailNormalized) {
    const row = this.db
      .prepare(
        `SELECT id, first_name, last_name, email, status
         FROM community_members
         WHERE email_normalized = ?`
      )
      .get(emailNormalized);

    return row || null;
  }

  createSignInToken(communityMemberId, tokenHash, expiresAt) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO member_sign_in_tokens
         (id, community_member_id, token_hash, created_at, expires_at, used_at)
         VALUES (?, ?, ?, ?, ?, NULL)`
      )
      .run(id, communityMemberId, tokenHash, now, expiresAt);

    return { id, createdAt: now, expiresAt };
  }

  consumeSignInToken(tokenHash) {
    const now = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      const token = this.db
        .prepare(
          `SELECT id, community_member_id, expires_at, used_at
           FROM member_sign_in_tokens
           WHERE token_hash = ?`
        )
        .get(tokenHash);

      if (!token) {
        return null;
      }

      if (token.used_at || token.expires_at <= now) {
        return null;
      }

      const result = this.db
        .prepare(
          `UPDATE member_sign_in_tokens
           SET used_at = ?
           WHERE id = ?
             AND used_at IS NULL`
        )
        .run(now, token.id);

      if (result.changes !== 1) {
        return null;
      }

      return {
        communityMemberId: token.community_member_id,
        usedAt: now
      };
    });

    return transaction();
  }

  createSession(communityMemberId, sessionTokenHash, expiresAt) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO member_sessions
         (id, community_member_id, session_token_hash, created_at, expires_at, revoked_at)
         VALUES (?, ?, ?, ?, ?, NULL)`
      )
      .run(id, communityMemberId, sessionTokenHash, now, expiresAt);

    return { id, createdAt: now, expiresAt };
  }

  findActiveSession(sessionTokenHash) {
    const now = new Date().toISOString();

    const row = this.db
      .prepare(
        `SELECT
           s.id AS session_id,
           s.community_member_id,
           s.created_at,
           s.expires_at,
           m.first_name,
           m.last_name,
           m.email,
           m.status
         FROM member_sessions s
         JOIN community_members m
           ON m.id = s.community_member_id
         WHERE s.session_token_hash = ?
           AND s.revoked_at IS NULL
           AND s.expires_at > ?`
      )
      .get(sessionTokenHash, now);

    return row || null;
  }
  getMemberProfile(communityMemberId) {
    const member = this.db
      .prepare(
        `SELECT
           id,
           first_name,
           last_name,
           email,
           about_you,
           status
         FROM community_members
         WHERE id = ?`
      )
      .get(communityMemberId);

    if (!member) {
      return null;
    }

    const interests = this.db
      .prepare(
        `SELECT i.label
         FROM community_member_interests cmi
         JOIN interests i
           ON i.id = cmi.interest_id
         WHERE cmi.community_member_id = ?
         ORDER BY i.display_order, i.label`
      )
      .all(communityMemberId)
      .map((row) => row.label);

    const accessibilityPerspectives = this.db
      .prepare(
        `SELECT ap.label
         FROM community_member_accessibility_perspectives cmap
         JOIN accessibility_perspectives ap
           ON ap.id = cmap.accessibility_perspective_id
         WHERE cmap.community_member_id = ?
         ORDER BY ap.display_order, ap.label`
      )
      .all(communityMemberId)
      .map((row) => row.label);

    const participationPreferences = this.db
      .prepare(
        `SELECT pp.label
         FROM community_member_participation_preferences cmpp
         JOIN participation_preferences pp
           ON pp.id = cmpp.participation_preference_id
         WHERE cmpp.community_member_id = ?
         ORDER BY pp.display_order, pp.label`
      )
      .all(communityMemberId)
      .map((row) => row.label);

    const directoryRecord = this.db
      .prepare(
        `SELECT participation_choice, recorded_at
         FROM directory_participation_records
         WHERE community_member_id = ?
         ORDER BY recorded_at DESC
         LIMIT 1`
      )
      .get(communityMemberId);

    return {
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      aboutYou: member.about_you || "",
      status: member.status,
      interests,
      accessibilityPerspectives,
      participationPreferences,
      directoryParticipation: directoryRecord
        ? directoryRecord.participation_choice
        : null
    };
  }
  updateMemberProfile(communityMemberId, profile) {
    const now = new Date().toISOString();

    const result = this.db
      .prepare(
        `UPDATE community_members
         SET first_name = ?,
             last_name = ?,
             about_you = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .run(
        profile.firstName,
        profile.lastName,
        profile.aboutYou || null,
        now,
        communityMemberId
      );

    return result.changes === 1;
  }

  setDirectoryParticipation(communityMemberId, choice) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO directory_participation_records
       (id, community_member_id, participation_choice, notice_version, recorded_at, source)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, communityMemberId, choice, "2026-10-02", now, "community_member_dashboard");
    return true;
  }


  getDirectoryProfile(communityMemberId) {
    return (
      this.db
        .prepare(
          `SELECT community_member_id,
                  headline,
                  location,
                  website_url,
                  show_email,
                  show_biography,
                  is_published,
                  created_at,
                  updated_at
           FROM community_directory_profiles
           WHERE community_member_id = ?`
        )
        .get(communityMemberId) || null
    );
  }

  saveDirectoryProfile(communityMemberId, profile) {
    const now = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO community_directory_profiles (
           community_member_id,
           headline,
           location,
           website_url,
           show_email,
           show_biography,
           is_published,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(community_member_id) DO UPDATE SET
           headline = excluded.headline,
           location = excluded.location,
           website_url = excluded.website_url,
           show_email = excluded.show_email,
           show_biography = excluded.show_biography,
           is_published = excluded.is_published,
           updated_at = excluded.updated_at`
      )
      .run(
        communityMemberId,
        profile.headline || null,
        profile.location || null,
        profile.websiteUrl || null,
        profile.showEmail ? 1 : 0,
        profile.showBiography ? 1 : 0,
        profile.isPublished ? 1 : 0,
        now,
        now
      );

    return this.getDirectoryProfile(communityMemberId);
  }


  listPublishedDirectoryProfiles(searchTerm = "") {
    const term = String(searchTerm || "").trim();
    const pattern = `%${term}%`;
    return this.db
      .prepare(
        `SELECT m.id AS community_member_id,
                m.first_name,
                m.last_name,
                m.email,
                m.about_you,
                d.headline,
                d.location,
                d.website_url,
                d.show_email,
                d.show_biography,
                d.updated_at
         FROM community_directory_profiles d
         JOIN community_members m ON m.id = d.community_member_id
         WHERE d.is_published = 1
           AND m.deleted_at IS NULL
           AND m.status NOT IN ('deleted', 'blocked')
           AND (? = '' OR m.first_name LIKE ? COLLATE NOCASE
                OR m.last_name LIKE ? COLLATE NOCASE
                OR COALESCE(d.headline, '') LIKE ? COLLATE NOCASE
                OR COALESCE(d.location, '') LIKE ? COLLATE NOCASE
                OR (d.show_biography = 1 AND COALESCE(m.about_you, '') LIKE ? COLLATE NOCASE))
         ORDER BY m.first_name COLLATE NOCASE, m.last_name COLLATE NOCASE`
      )
      .all(term, pattern, pattern, pattern, pattern, pattern);
  }

  getPublishedDirectoryProfile(communityMemberId) {
    return this.db.prepare(
      `SELECT m.id AS community_member_id, m.first_name, m.last_name, m.email, m.about_you,
              d.headline, d.location, d.website_url, d.show_email, d.show_biography, d.updated_at
       FROM community_directory_profiles d
       JOIN community_members m ON m.id = d.community_member_id
       WHERE d.community_member_id = ? AND d.is_published = 1
         AND m.deleted_at IS NULL AND m.status NOT IN ('deleted', 'blocked')`
    ).get(communityMemberId) || null;
  }

  createBulletinPost(communityMemberId, subject, body) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO community_bulletin_posts
         (id, community_member_id, subject, body, created_at, updated_at, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, 0)`
      )
      .run(id, communityMemberId, subject, body, now, now);
    return id;
  }

  listBulletinPosts(limit = 50) {
    return this.db
      .prepare(
        `SELECT p.id, p.subject, p.body, p.created_at,
                m.first_name, m.last_name,
                COUNT(r.id) AS reply_count,
                COALESCE(MAX(r.created_at), p.created_at) AS last_activity_at
         FROM community_bulletin_posts p
         JOIN community_members m ON m.id = p.community_member_id
         LEFT JOIN community_bulletin_replies r
           ON r.bulletin_post_id = p.id AND r.is_deleted = 0
         WHERE p.is_deleted = 0
         GROUP BY p.id, p.subject, p.body, p.created_at, m.first_name, m.last_name
         ORDER BY last_activity_at DESC
         LIMIT ?`
      )
      .all(limit);
  }

  getBulletinPost(postId) {
    return this.db.prepare(
      `SELECT p.id, p.community_member_id, p.subject, p.body, p.created_at,
              m.first_name, m.last_name
       FROM community_bulletin_posts p
       JOIN community_members m ON m.id = p.community_member_id
       WHERE p.id = ? AND p.is_deleted = 0`
    ).get(postId) || null;
  }

  listBulletinReplies(postId) {
    return this.db.prepare(
      `SELECT r.id, r.bulletin_post_id, r.community_member_id, r.body, r.created_at,
              m.first_name, m.last_name
       FROM community_bulletin_replies r
       JOIN community_members m ON m.id = r.community_member_id
       WHERE r.bulletin_post_id = ? AND r.is_deleted = 0
       ORDER BY r.created_at ASC`
    ).all(postId);
  }

  createBulletinReply(postId, communityMemberId, body) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO community_bulletin_replies
       (id, bulletin_post_id, community_member_id, body, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).run(id, postId, communityMemberId, body, now, now);
    return id;
  }

  followBulletinPost(postId, communityMemberId) {
    const result = this.db.prepare(
      `INSERT OR IGNORE INTO community_bulletin_follows
       (bulletin_post_id, community_member_id, created_at) VALUES (?, ?, ?)`
    ).run(postId, communityMemberId, new Date().toISOString());
    return result.changes === 1;
  }

  unfollowBulletinPost(postId, communityMemberId) {
    return this.db.prepare(
      `DELETE FROM community_bulletin_follows WHERE bulletin_post_id = ? AND community_member_id = ?`
    ).run(postId, communityMemberId).changes === 1;
  }

  isFollowingBulletinPost(postId, communityMemberId) {
    return Boolean(this.db.prepare(
      `SELECT 1 FROM community_bulletin_follows WHERE bulletin_post_id = ? AND community_member_id = ?`
    ).get(postId, communityMemberId));
  }

  listBulletinFollowerIds(postId) {
    return this.db.prepare(
      `SELECT community_member_id FROM community_bulletin_follows WHERE bulletin_post_id = ?`
    ).all(postId).map((row) => row.community_member_id);
  }

  getNotificationPreferences(communityMemberId) {
    const row = this.db.prepare(
      `SELECT dashboard_enabled, email_replies_enabled, sms_replies_enabled, sms_phone
       FROM community_notification_preferences WHERE community_member_id = ?`
    ).get(communityMemberId);
    return row || { dashboard_enabled: 1, email_replies_enabled: 1, sms_replies_enabled: 0, sms_phone: null };
  }

  saveNotificationPreferences(communityMemberId, preferences) {
    const now = new Date().toISOString();
    this.db.prepare(
      `INSERT INTO community_notification_preferences
       (community_member_id, dashboard_enabled, email_replies_enabled, sms_replies_enabled, sms_phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(community_member_id) DO UPDATE SET
         dashboard_enabled = excluded.dashboard_enabled,
         email_replies_enabled = excluded.email_replies_enabled,
         sms_replies_enabled = excluded.sms_replies_enabled,
         sms_phone = excluded.sms_phone,
         updated_at = excluded.updated_at`
    ).run(communityMemberId, preferences.dashboardEnabled ? 1 : 0,
      preferences.emailRepliesEnabled ? 1 : 0, preferences.smsRepliesEnabled ? 1 : 0,
      preferences.smsPhone || null, now, now);
    return this.getNotificationPreferences(communityMemberId);
  }

  createNotification(communityMemberId, type, postId, replyId, message) {
    const id = crypto.randomUUID();
    this.db.prepare(
      `INSERT INTO community_notifications
       (id, community_member_id, notification_type, bulletin_post_id, bulletin_reply_id, message, created_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`
    ).run(id, communityMemberId, type, postId || null, replyId || null, message, new Date().toISOString());
    return id;
  }

  listNotifications(communityMemberId, limit = 20) {
    return this.db.prepare(
      `SELECT id, notification_type, bulletin_post_id, message, created_at, read_at
       FROM community_notifications
       WHERE community_member_id = ?
       ORDER BY created_at DESC LIMIT ?`
    ).all(communityMemberId, limit);
  }

  getNotification(notificationId, communityMemberId) {
    return this.db.prepare(
      `SELECT id, notification_type, bulletin_post_id, bulletin_reply_id, message, created_at, read_at
       FROM community_notifications WHERE id = ? AND community_member_id = ?`
    ).get(notificationId, communityMemberId) || null;
  }

  markNotificationRead(notificationId, communityMemberId) {
    return this.db.prepare(
      `UPDATE community_notifications SET read_at = COALESCE(read_at, ?)
       WHERE id = ? AND community_member_id = ?`
    ).run(new Date().toISOString(), notificationId, communityMemberId).changes === 1;
  }

  countUnreadNotifications(communityMemberId) {
    return this.db.prepare(
      `SELECT COUNT(*) AS count FROM community_notifications
       WHERE community_member_id = ? AND read_at IS NULL`
    ).get(communityMemberId).count;
  }

  markNotificationsRead(communityMemberId) {
    return this.db.prepare(
      `UPDATE community_notifications SET read_at = ?
       WHERE community_member_id = ? AND read_at IS NULL`
    ).run(new Date().toISOString(), communityMemberId).changes;
  }

  recordPageVisit(path, communityMemberId = null) {
    this.db
      .prepare(
        `INSERT INTO community_page_visits (id, path, community_member_id, visited_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(crypto.randomUUID(), path, communityMemberId, new Date().toISOString());
  }

  getVisitCounts() {
    return this.db
      .prepare(
        `SELECT path, COUNT(*) AS visits
         FROM community_page_visits
         GROUP BY path
         ORDER BY visits DESC, path`
      )
      .all();
  }


  revokeSession(sessionTokenHash) {
    const now = new Date().toISOString();

    return this.db
      .prepare(
        `UPDATE member_sessions
         SET revoked_at = ?
         WHERE session_token_hash = ?
           AND revoked_at IS NULL`
      )
      .run(now, sessionTokenHash).changes === 1;
  }
}

module.exports = { MemberAccessStore };