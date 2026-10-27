"use strict";
const crypto = require("crypto");
const { escapeHtml } = require("./reviewHtml");
function initializeReview(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS community_admin_reviews (
    community_member_id TEXT PRIMARY KEY REFERENCES community_members(id),
    reviewed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS community_admin_digest_runs (
    digest_date TEXT PRIMARY KEY,
    sent_at TEXT NOT NULL,
    registration_count INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS community_admin_digest_deliveries (
    community_member_id TEXT PRIMARY KEY REFERENCES community_members(id),
    sent_at TEXT NOT NULL
  );`);
}
function getMembers(db, limit=100, offset=0) {
  return db.prepare(`SELECT cm.id,cm.first_name,cm.last_name,cm.email,cm.status,cm.created_at,r.reviewed_at
    FROM community_members cm LEFT JOIN community_admin_reviews r ON r.community_member_id=cm.id
    WHERE cm.status <> 'deleted' ORDER BY cm.created_at DESC,cm.id DESC LIMIT ? OFFSET ?`).all(limit,offset);
}
function getMember(db,id) {
  const member=db.prepare(`SELECT cm.id,cm.first_name,cm.last_name,cm.email,cm.about_you,cm.status,cm.created_at,r.reviewed_at,
    (SELECT participation_choice FROM directory_participation_records WHERE community_member_id=cm.id ORDER BY recorded_at DESC LIMIT 1) AS directory_choice
    FROM community_members cm LEFT JOIN community_admin_reviews r ON r.community_member_id=cm.id WHERE cm.id=?`).get(id);
  if (!member) return null;
  member.interests=db.prepare(`SELECT i.label FROM interests i JOIN community_member_interests mi ON mi.interest_id=i.id WHERE mi.community_member_id=? ORDER BY i.display_order`).all(id).map(r=>r.label);
  member.participation=db.prepare(`SELECT p.label FROM participation_preferences p JOIN community_member_participation_preferences mp ON mp.participation_preference_id=p.id WHERE mp.community_member_id=? ORDER BY p.display_order`).all(id).map(r=>r.label);
  return member;
}
function reviewToken(secret,id) {return crypto.createHmac('sha256',secret).update('review:'+id).digest('hex');}
function validToken(secret,id,provided) {const expected=reviewToken(secret,id); return typeof provided==='string' && /^[a-f0-9]{64}$/.test(provided) && crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(provided));}
function page(title,body) {return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} - Open Door Design</title><style>body{font:1.1rem/1.5 system-ui,sans-serif;max-width:65rem;margin:1rem auto;padding:0 1rem}a,button{padding:.25rem}a:focus-visible,button:focus-visible{outline:3px solid #1259a8}li{margin:.5rem 0}</style></head><body><a href="#main">Skip to main content</a><header><p>Open Door Design Community Administration</p></header><nav aria-label="Administration"><a href="/community/admin/">Overview</a> <a href="/community/admin/members">Member review</a></nav><main id="main"><h1>${escapeHtml(title)}</h1>${body}</main><footer><p>Private administrator area</p></footer></body></html>`;}
function listPage(db,offset=0) {
 const rows=getMembers(db,100,offset);
 const count=db.prepare("SELECT COUNT(*) AS n FROM community_members WHERE status <> 'deleted'").get().n;
 const newCount=db.prepare("SELECT COUNT(*) AS n FROM community_members cm LEFT JOIN community_admin_reviews r ON cm.id=r.community_member_id WHERE cm.status <> 'deleted' AND r.reviewed_at IS NULL").get().n;
 const items=rows.map(m=>`<li><a href="/community/admin/members/${encodeURIComponent(m.id)}">${escapeHtml(m.first_name+' '+m.last_name)}</a>, ${escapeHtml(m.email)}. Membership: ${escapeHtml(m.status)}. Review: ${m.reviewed_at?'Reviewed':'New'}. Registered: ${escapeHtml(m.created_at)}.</li>`).join('');
 const prev=offset>0?`<a href="?offset=${Math.max(0,offset-100)}">Previous 100</a>`:'';
 const next=offset+100<count?`<a href="?offset=${offset+100}">Next 100</a>`:'';
 return page('Member review',`<p>${count} members, ${newCount} awaiting review. Review does not change membership access.</p><ol start="${offset+1}">${items}</ol><p>${prev} ${next}</p>`);
}
function detailPage(member,secret) {
 const list=(items)=>items.length?`<ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:'<p>None selected.</p>';
 return page('Review member',`<h2>${escapeHtml(member.first_name+' '+member.last_name)}</h2><p>Email: ${escapeHtml(member.email)}</p><p>Registered: ${escapeHtml(member.created_at)}</p><p>Membership status: ${escapeHtml(member.status)}</p><p>Review status: ${member.reviewed_at?'Reviewed '+escapeHtml(member.reviewed_at):'New'}</p><h2>Interests</h2>${list(member.interests)}<h2>Participation preferences</h2>${list(member.participation)}<h2>Directory choice</h2><p>${escapeHtml(member.directory_choice||'Not recorded')}</p><h2>About member</h2><p>${escapeHtml(member.about_you||'Not provided')}</p>${member.reviewed_at?'':`<form method="post" action="/community/admin/members/${encodeURIComponent(member.id)}/review"><input type="hidden" name="token" value="${reviewToken(secret,member.id)}"><button type="submit">Mark as reviewed</button></form>`}<p><a href="/community/admin/members">Back to members</a></p>`);
}
module.exports={initializeReview,getMembers,getMember,reviewToken,validToken,listPage,detailPage};
