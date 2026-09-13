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