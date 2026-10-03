"use strict";

const { sendBulletinReplyEmail } = require("../email/emailService");
const { sendBulletinReplySms } = require("../sms/smsService");

async function deliverToMember({ memberStore, emailProvider, smsProvider, config, recipientId, post, replyId, replier, replyBody }) {
  const recipient = memberStore.getMemberProfile(recipientId);
  if (!recipient) return { memberId: recipientId, dashboard: false, email: false, sms: false };

  const prefs = memberStore.getNotificationPreferences(recipientId);
  const replierName = `${replier.firstName} ${replier.lastName}`.trim();
  const result = { memberId: recipientId, dashboard: false, email: false, sms: false };

  if (prefs.dashboard_enabled) {
    memberStore.createNotification(
      recipientId,
      "bulletin_reply",
      post.id,
      replyId,
      `${replierName} replied to a Bulletin Board conversation you are following: ${post.subject}`
    );
    result.dashboard = true;
  }

  if (prefs.email_replies_enabled) {
    try {
      await sendBulletinReplyEmail(
        emailProvider,
        { firstName: recipient.firstName, email: recipient.email },
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
  const replier = memberStore.getMemberProfile(replierMemberId);
  if (!replier) return { suppressed: false, recipients: [] };

  const followerIds = typeof memberStore.listBulletinFollowerIds === "function"
    ? memberStore.listBulletinFollowerIds(post.id)
    : [];
  const recipientIds = [...new Set([post.community_member_id, ...followerIds])]
    .filter((memberId) => memberId !== replierMemberId);

  if (!recipientIds.length) return { suppressed: true, recipients: [] };

  const recipients = [];
  for (const recipientId of recipientIds) {
    recipients.push(await deliverToMember({
      memberStore, emailProvider, smsProvider, config, recipientId,
      post, replyId, replier, replyBody
    }));
  }

  return {
    suppressed: false,
    recipients,
    dashboard: recipients.some((r) => r.dashboard),
    email: recipients.some((r) => r.email),
    sms: recipients.some((r) => r.sms)
  };
}

module.exports = { deliverBulletinReplyNotifications };
