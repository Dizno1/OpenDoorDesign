"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { deliverBulletinReplyNotifications } = require("../notifications/notificationService");
const { renderBulletinReplyEmail } = require("../email/templates/bulletinReplyEmail");
const { renderBulletinReplySms } = require("../sms/smsService");

const config = {
  publicBaseUrl: "https://community.example.test",
  email: { fromAddress: "Community <community@example.test>" },
  sms: { provider: "console" }
};

function makeStore(prefs = {}) {
  const notifications = [];
  return {
    notifications,
    getMemberProfile(id) {
      if (id === "owner") return { firstName: "Dean", lastName: "Owner", email: "owner@example.test" };
      if (id === "reply") return { firstName: "Alex", lastName: "Responder", email: "reply@example.test" };
      return null;
    },
    getNotificationPreferences() {
      return { dashboard_enabled: 1, email_replies_enabled: 1, sms_replies_enabled: 0, sms_phone: null, ...prefs };
    },
    createNotification(...args) { notifications.push(args); }
  };
}

function post() { return { id: "post-1", community_member_id: "owner", subject: "Accessible meetup" }; }

test("self replies are suppressed across every notification channel", async () => {
  const store = makeStore({ sms_replies_enabled: 1, sms_phone: "+16175550123" });
  let emailCalls = 0, smsCalls = 0;
  const result = await deliverBulletinReplyNotifications({
    memberStore: store,
    emailProvider: { async send(){ emailCalls++; } },
    smsProvider: { async send(){ smsCalls++; } },
    config,
    post: { ...post(), community_member_id: "reply" },
    replyId: "r1",
    replierMemberId: "reply",
    replyBody: "My own reply"
  });
  assert.equal(result.suppressed, true);
  assert.equal(store.notifications.length, 0);
  assert.equal(emailCalls, 0);
  assert.equal(smsCalls, 0);
});

test("enabled channels are attempted independently", async () => {
  const store = makeStore({ sms_replies_enabled: 1, sms_phone: "+16175550123" });
  const sent = [];
  const result = await deliverBulletinReplyNotifications({
    memberStore: store,
    emailProvider: { async send(message){ sent.push(["email", message]); return {sent:true}; } },
    smsProvider: { async send(message){ sent.push(["sms", message]); return {sent:true}; } },
    config, post: post(), replyId: "r1", replierMemberId: "reply", replyBody: "Private reply text"
  });
  assert.equal(result.dashboard, true);
  assert.equal(result.email, true);
  assert.equal(result.sms, true);
  assert.equal(store.notifications.length, 1);
  assert.deepEqual(sent.map(x => x[0]), ["email", "sms"]);
});

test("delivery failures do not throw after a reply has already been stored", async () => {
  const store = makeStore({ sms_replies_enabled: 1, sms_phone: "+16175550123" });
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await deliverBulletinReplyNotifications({
      memberStore: store,
      emailProvider: { async send(){ throw new Error("email down"); } },
      smsProvider: { async send(){ throw new Error("sms down"); } },
      config, post: post(), replyId: "r1", replierMemberId: "reply", replyBody: "Stored first"
    });
    assert.equal(result.dashboard, true);
    assert.equal(result.email, false);
    assert.equal(result.sms, false);
    assert.equal(store.notifications.length, 1);
  } finally { console.error = originalError; }
});

test("reply email announces the response without copying the reply body", () => {
  const message = renderBulletinReplyEmail(
    { firstName: "Dean", email: "owner@example.test" },
    { postId: "post-1", subject: "Accessible meetup", replierName: "Alex Responder", replyBody: "Sensitive reply content" },
    config
  );
  assert.match(message.text, /Alex Responder replied/);
  assert.ok(!message.text.includes("Sensitive reply content"));
  assert.ok(!message.html.includes("Sensitive reply content"));
  assert.match(message.text, /Read the conversation:/);
});

test("SMS contains a short alert and conversation link but no reply body", () => {
  const message = renderBulletinReplySms({ phone: "+16175550123", postId: "post-1", replierName: "Alex Responder", replyBody: "Sensitive reply content" }, config);
  assert.equal(message.to, "+16175550123");
  assert.match(message.text, /Alex Responder replied/);
  assert.match(message.text, /community\.example\.test/);
  assert.ok(!message.text.includes("Sensitive reply content"));
});

test("followers receive reply notifications while the member who replied does not", async () => {
  const notifications = [];
  const sent = [];
  const store = {
    getMemberProfile(id) {
      const members = {
        owner: { firstName: "Dean", lastName: "Owner", email: "owner@example.test" },
        reply: { firstName: "Alex", lastName: "Responder", email: "reply@example.test" },
        follower: { firstName: "Taylor", lastName: "Follower", email: "follower@example.test" }
      };
      return members[id] || null;
    },
    listBulletinFollowerIds() { return ["follower", "reply"]; },
    getNotificationPreferences() {
      return { dashboard_enabled: 1, email_replies_enabled: 1, sms_replies_enabled: 0, sms_phone: null };
    },
    createNotification(memberId) { notifications.push(memberId); }
  };
  const result = await deliverBulletinReplyNotifications({
    memberStore: store,
    emailProvider: { async send(message){ sent.push(message.to); return { sent: true }; } },
    smsProvider: { async send(){ return { sent: true }; } },
    config, post: post(), replyId: "r2", replierMemberId: "reply", replyBody: "New reply"
  });

  assert.deepEqual(notifications.sort(), ["follower", "owner"]);
  assert.equal(result.recipients.length, 2);
  assert.equal(sent.length, 2);
});
