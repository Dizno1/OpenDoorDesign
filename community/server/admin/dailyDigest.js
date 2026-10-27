"use strict";
const { escapeHtml } = require('./reviewHtml');
const { initializeReview } = require('./memberReview');

function previousEasternDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(now.getTime() - 24 * 3600 * 1000));
}

// A delivery record belongs to a member, not a calendar day. Existing digest
// run records remain untouched for historical/operational purposes.
function unsentMembers(db, limit = 20) {
  return db.prepare(`
    SELECT cm.id, cm.first_name, cm.last_name, cm.created_at
    FROM community_members cm
    LEFT JOIN community_admin_reviews r ON r.community_member_id = cm.id
    LEFT JOIN community_admin_digest_deliveries d ON d.community_member_id = cm.id
    WHERE cm.status <> 'deleted'
      AND r.reviewed_at IS NULL
      AND d.community_member_id IS NULL
    ORDER BY cm.created_at ASC, cm.id ASC
    LIMIT ?
  `).all(limit);
}

async function sendDailyDigest({ db, provider, config, now = new Date() }) {
  initializeReview(db);
  const rows = unsentMembers(db, 20);
  if (!rows.length) return { status: 'empty', count: 0 };
  if (!config.admin.digestRecipient) throw new Error('ADMIN_DIGEST_RECIPIENT is required.');

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const base = config.publicBaseUrl.replace(/\/$/, '');
  const lines = rows.map(r => `${r.first_name} ${r.last_name} - ${r.created_at}`);
  const text = `Open Door Design Community registration digest: ${date}\n\n${rows.length} registration(s) not previously reported.\n\n${lines.join('\n')}\n\nReview members: ${base}/community/admin/members\n`;
  const html = `<h1>Community registration digest: ${escapeHtml(date)}</h1><p>${rows.length} registration(s) not previously reported.</p><ul>${rows.map(r => `<li>${escapeHtml(r.first_name + ' ' + r.last_name)} - ${escapeHtml(r.created_at)}</li>`).join('')}</ul><p><a href="${escapeHtml(base)}/community/admin/members">Review members</a></p>`;
  const result = await provider.send({
    from: config.email.fromAddress,
    to: config.admin.digestRecipient,
    subject: `Community registrations awaiting first report: ${date} (${rows.length})`,
    text, html
  });
  if (!result || !result.sent) throw new Error('Email provider did not confirm sending.');

  // Record exactly the members included in the accepted email. The unique
  // member key prevents routine subsequent digests from including them again.
  const insert = db.prepare('INSERT OR IGNORE INTO community_admin_digest_deliveries (community_member_id, sent_at) VALUES (?, ?)');
  const sentAt = new Date().toISOString();
  db.transaction(() => { for (const row of rows) insert.run(row.id, sentAt); })();
  return { status: 'sent', count: rows.length, date };
}

module.exports = { previousEasternDay, unsentMembers, sendDailyDigest };
