"use strict";

const { sendBulletinReplyEmail } = require("../email/emailService");
const { sendBulletinReplySms } = require("../sms/smsService");

async function deliverBulletinReplyNotifications({
  memberStore,
  emailProvider,
  smsProvider,
  config,
  post,
  replyId,
  replierMemberId,
  replyBody
}) {
  if (post.community_member_id === replierMemberId) {
    return { suppressed: true, dashboard: false, email: false, sms: false };
  }

  const owner = memberStore.getMemberProfile(post.community_member_id);
  const replier = memberStore.getMemberProfile(replierMemberId);
  if (!owner || !replier) {
    return { suppressed: false, dashboard: false, email: false, sms: false };
  }

  const prefs = memberStore.getNotificationPreferences(post.community_member_id);
  const replierName = `${replier.firstName} ${replier.lastName}`.trim();
  const result = { suppressed: false, dashboard: false, email: false, sms: false };

  if (prefs.dashboard_enabled) {
    memberStore.createNotification(
      post.community_member_id,
      "bulletin_reply",
      post.id,
      replyId,
      `${replierName} replied to your Bulletin Board post: ${post.subject}`
    );
    result.dashboard = true;
  }

  if (prefs.email_replies_enabled) {
    try {
      await sendBulletinReplyEmail(
        emailProvider,
        { firstName: owner.firstName, email: owner.email },
        { postId: post.id, subject: post.subject, replierName, replyBody },
        config
      );
      result.email = true;
    } catch (error) {
      console.error("[community-notifications] reply email delivery failed:", error);
    }
  }

  if (prefs.sms_replies_enabled && prefs.sms_phone) {
    try {
      await sendBulletinReplySms(
        smsProvider,
        { phone: prefs.sms_phone, postId: post.id, replierName },
        config
      );
      result.sms = true;
    } catch (error) {
      console.error("[community-notifications] reply SMS delivery failed:", error);
    }
  }

  return result;
}

module.exports = { deliverBulletinReplyNotifications };
