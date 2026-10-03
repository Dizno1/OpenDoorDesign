"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { initDatabase } = require("../db/init");
const { SqliteRegistrationStore } = require("../storage/sqliteRegistrationStore");
const { MemberAccessStore } = require("../memberAccess/memberStore");
const { generateToken, hashToken } = require("../memberAccess/memberAuth");

function makeTempStores() {
  const dbPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "community-member-access-")),
    "test.db"
  );

  const db = initDatabase(dbPath);

  return {
    db,
    registrationStore: new SqliteRegistrationStore(db),
    memberAccessStore: new MemberAccessStore(db)
  };
}

function createMember(registrationStore) {
  return registrationStore.createRegistration({
    firstName: "Dean",
    lastName: "Testworthy",
    email: "dean@example.com",
    emailNormalized: "dean@example.com",
    aboutYou: "",
    interests: [],
    accessibilityPerspectives: [],
    participationPreferences: [],
    directoryParticipation: "yes",
    directoryParticipationVersion: "2026-09-07",
    privacyConsent: true,
    privacyNoticeVersion: "2026-07-30"
  });
}

test("findMemberByNormalizedEmail returns an existing member", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  createMember(registrationStore);

  const member = memberAccessStore.findMemberByNormalizedEmail("dean@example.com");

  assert.ok(member);
  assert.equal(member.email, "dean@example.com");
});

test("sign-in token can be consumed only once", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  memberAccessStore.createSignInToken(member.id, tokenHash, expiresAt);

  const firstUse = memberAccessStore.consumeSignInToken(tokenHash);
  assert.ok(firstUse);
  assert.equal(firstUse.communityMemberId, member.id);

  const secondUse = memberAccessStore.consumeSignInToken(tokenHash);
  assert.equal(secondUse, null);
});

test("expired sign-in token cannot be consumed", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() - 60 * 1000).toISOString();

  memberAccessStore.createSignInToken(member.id, tokenHash, expiresAt);

  assert.equal(memberAccessStore.consumeSignInToken(tokenHash), null);
});

test("active session resolves the member", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const rawSession = generateToken();
  const sessionHash = hashToken(rawSession);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  memberAccessStore.createSession(member.id, sessionHash, expiresAt);

  const session = memberAccessStore.findActiveSession(sessionHash);

  assert.ok(session);
  assert.equal(session.email, "dean@example.com");
});

test("revoked session is no longer active", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const rawSession = generateToken();
  const sessionHash = hashToken(rawSession);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  memberAccessStore.createSession(member.id, sessionHash, expiresAt);

  assert.equal(memberAccessStore.revokeSession(sessionHash), true);
  assert.equal(memberAccessStore.findActiveSession(sessionHash), null);
});

test("Bulletin Board posts can be created and retrieved as conversations", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const postId = memberAccessStore.createBulletinPost(
    member.id,
    "Accessible testing meetup",
    "Would anyone like to compare screen-reader testing notes?"
  );

  const post = memberAccessStore.getBulletinPost(postId);
  assert.ok(post);
  assert.equal(post.community_member_id, member.id);
  assert.equal(post.subject, "Accessible testing meetup");
  assert.equal(post.first_name, "Dean");

  const posts = memberAccessStore.listBulletinPosts();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, postId);
});

test("Bulletin Board replies remain attached to the correct post and author", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const owner = createMember(registrationStore);
  const replier = registrationStore.createRegistration({
    firstName: "Alex",
    lastName: "Responder",
    email: "alex@example.com",
    emailNormalized: "alex@example.com",
    aboutYou: "",
    interests: [],
    accessibilityPerspectives: [],
    participationPreferences: [],
    directoryParticipation: "no",
    directoryParticipationVersion: "2026-09-07",
    privacyConsent: true,
    privacyNoticeVersion: "2026-07-30"
  });
  const postId = memberAccessStore.createBulletinPost(owner.id, "Question", "Original post");

  const replyId = memberAccessStore.createBulletinReply(postId, replier.id, "Here is a reply.");
  const replies = memberAccessStore.listBulletinReplies(postId);

  assert.equal(replies.length, 1);
  assert.equal(replies[0].id, replyId);
  assert.equal(replies[0].community_member_id, replier.id);
  assert.equal(replies[0].body, "Here is a reply.");
  assert.equal(replies[0].first_name, "Alex");
});

test("notification preferences default to dashboard and email on with SMS off", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  assert.deepEqual(memberAccessStore.getNotificationPreferences(member.id), {
    dashboard_enabled: 1,
    email_replies_enabled: 1,
    sms_replies_enabled: 0,
    sms_phone: null
  });
});

test("notification preferences persist dashboard email and SMS choices", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);

  const saved = memberAccessStore.saveNotificationPreferences(member.id, {
    dashboardEnabled: true,
    emailRepliesEnabled: false,
    smsRepliesEnabled: true,
    smsPhone: "+16175550123"
  });

  assert.equal(saved.dashboard_enabled, 1);
  assert.equal(saved.email_replies_enabled, 0);
  assert.equal(saved.sms_replies_enabled, 1);
  assert.equal(saved.sms_phone, "+16175550123");
});

test("member notifications track unread state and can be marked read", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const member = createMember(registrationStore);
  const postId = memberAccessStore.createBulletinPost(member.id, "Notice me", "Post body");
  const replyId = memberAccessStore.createBulletinReply(postId, member.id, "Reply body");

  const notificationId = memberAccessStore.createNotification(
    member.id,
    "bulletin_reply",
    postId,
    replyId,
    "Someone replied to your Bulletin Board post."
  );

  assert.equal(memberAccessStore.countUnreadNotifications(member.id), 1);
  const notifications = memberAccessStore.listNotifications(member.id);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].id, notificationId);
  assert.equal(notifications[0].read_at, null);

  assert.equal(memberAccessStore.markNotificationsRead(member.id), 1);
  assert.equal(memberAccessStore.countUnreadNotifications(member.id), 0);
  assert.ok(memberAccessStore.listNotifications(member.id)[0].read_at);
});

test("notifications are private to the member they belong to", () => {
  const { registrationStore, memberAccessStore } = makeTempStores();
  const first = createMember(registrationStore);
  const second = registrationStore.createRegistration({
    firstName: "Morgan",
    lastName: "Member",
    email: "morgan@example.com",
    emailNormalized: "morgan@example.com",
    aboutYou: "",
    interests: [],
    accessibilityPerspectives: [],
    participationPreferences: [],
    directoryParticipation: "no",
    directoryParticipationVersion: "2026-09-07",
    privacyConsent: true,
    privacyNoticeVersion: "2026-07-30"
  });

  memberAccessStore.createNotification(first.id, "bulletin_reply", null, null, "Private notice");

  assert.equal(memberAccessStore.listNotifications(first.id).length, 1);
  assert.equal(memberAccessStore.listNotifications(second.id).length, 0);
  assert.equal(memberAccessStore.countUnreadNotifications(second.id), 0);
});
