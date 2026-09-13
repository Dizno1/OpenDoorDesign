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