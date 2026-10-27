"use strict";
const { escapeHtml }=require('./reviewHtml');
const { initializeReview }=require('./memberReview');
function previousEasternDay(now=new Date()) {
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now.getTime()-24*3600*1000));
 return day;
}
function rowsForDay(db,date) {
 // SQLite created_at uses UTC. Convert using JS to avoid SQLite's missing IANA timezone support.
 const candidates=db.prepare("SELECT id,first_name,last_name,created_at FROM community_members WHERE created_at >= ? AND created_at < ? ORDER BY created_at,id").all(`${date} 00:00:00`,new Date(Date.parse(date+'T00:00:00Z')+2*86400000).toISOString());
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
 return candidates.filter(r=>{const d=new Date(r.created_at.includes('T')?r.created_at:r.created_at.replace(' ','T')+'Z');return !isNaN(d)&&fmt.format(d)===date;});
}
async function sendDailyDigest({db,provider,config,date=previousEasternDay(),now=new Date()}) {
 initializeReview(db);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)) throw new Error('Digest date must be a completed Eastern calendar day.');
 if(db.prepare('SELECT 1 FROM community_admin_digest_runs WHERE digest_date=?').get(date))return {status:'already_sent'};
 const rows=rowsForDay(db,date);
 if(!rows.length)return {status:'empty'};
 if(!config.admin.digestRecipient)throw new Error('ADMIN_DIGEST_RECIPIENT is required.');
 const base=config.publicBaseUrl.replace(/\/$/,'');
 const max=20;
 const text=`Open Door Design Community registrations for ${date} (Eastern Time)\n\n${rows.length} new registration(s).\n\n${rows.slice(0,max).map(r=>`${r.first_name} ${r.last_name} - ${r.created_at}`).join('\n')}${rows.length>max?'\nAdditional registrations are available in the dashboard.':''}\n\nReview members: ${base}/community/admin/members\n`;
 const html=`<h1>Community registration digest: ${escapeHtml(date)}</h1><p>${rows.length} new registration(s).</p><ul>${rows.slice(0,max).map(r=>`<li>${escapeHtml(r.first_name+' '+r.last_name)} - ${escapeHtml(r.created_at)}</li>`).join('')}</ul>${rows.length>max?'<p>Additional registrations are available in the dashboard.</p>':''}<p><a href="${escapeHtml(base)}/community/admin/members">Review members</a></p>`;
 const result=await provider.send({from:config.email.fromAddress,to:config.admin.digestRecipient,subject:`Community registrations: ${date} (${rows.length})`,text,html});
 if(!result||!result.sent)throw new Error('Email provider did not confirm sending.');
 db.prepare('INSERT INTO community_admin_digest_runs (digest_date,sent_at,registration_count) VALUES (?,?,?)').run(date,new Date().toISOString(),rows.length);
 return {status:'sent',count:rows.length,date};
}
module.exports={previousEasternDay,rowsForDay,sendDailyDigest};
