"use strict";
function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function renderBulletinReplyEmail(member,details,config){
 const url=`${config.publicBaseUrl}/community/member/bulletin-board/post/${encodeURIComponent(details.postId)}/`;
 const subject=`New reply to: ${details.subject}`;
 const text=[`Hello ${member.firstName || ""},`,"",`${details.replierName} replied to your Community Bulletin Board post: ${details.subject}`,"",`Read the conversation: ${url}`,"","You can change reply notifications from your Community Notifications page."].join("\n");
 const html=`<p>Hello ${escapeHtml(member.firstName)},</p><p>${escapeHtml(details.replierName)} replied to your Community Bulletin Board post: <strong>${escapeHtml(details.subject)}</strong></p><p><a href="${escapeHtml(url)}">Read the conversation</a></p><p>You can change reply notifications from your Community Notifications page.</p>`;
 return {to:member.email,from:config.email.fromAddress,subject,text,html};
}
module.exports={renderBulletinReplyEmail};
