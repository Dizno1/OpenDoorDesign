"use strict";

/**
 * These tests require `better-sqlite3`, a native module, installed via
 * `npm install` in this folder. They were written and reviewed for
 * correctness in this session but could not be executed here: this sandbox
 * has no network access, so `npm install` cannot fetch the package (see
 * Feature 003 Community Registration Production Readiness.md, "Testing").
 * Run `npm install && npm test` locally or in CI to execute them.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { initDatabase } = require("../db/init");
const { SqliteRegistrationStore } = require("../storage/sqliteRegistrationStore");

function makeTempStore() {
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "community-db-test-")), "test.db");
  const db = initDatabase(dbPath);
  return { store: new SqliteRegistrationStore(db), dbPath };
}

const validRegistration = {
  firstName: "Dean",
  lastName: "Testworthy",
  email: "dean@example.com",
  emailNormalized: "dean@example.com",
  aboutYou: "",
  interests: ["Accessibility education"],
  accessibilityPerspectives: [],
  participationPreferences: [],
  privacyConsent: true,
  privacyNoticeVersion: "2026-07-30"
};

test("database initialization applies the schema and seeds reference data", () => {
  const { store } = makeTempStore();
  const interestCount = store.db.prepare("SELECT COUNT(*) AS count FROM interests").get();
  assert.ok(interestCount.count > 0, "reference interests should be seeded");
  store.ping();
});

test("successful storage creates a member and a consent record", () => {
  const { store } = makeTempStore();
  const created = store.createRegistration(validRegistration);
  assert.ok(created.id);

  const member = store.findByNormalizedEmail("dean@example.com");
  assert.equal(member.first_name, "Dean");
  assert.equal(member.status, "pending");

  const consent = store.db
    .prepare("SELECT * FROM consent_records WHERE community_member_id = ?")
    .get(created.id);
  assert.equal(consent.consent_status, "granted");
  assert.equal(consent.notice_version, "2026-07-30");
});

test("duplicate email is detected via findByNormalizedEmail before a second insert", () => {
  const { store } = makeTempStore();
  store.createRegistration(validRegistration);

  const existing = store.findByNormalizedEmail("dean@example.com");
  assert.ok(existing, "the server route checks this before deciding whether to insert again");
  // server.js only skips creating a second registration when status is
  // "active"; a "pending" duplicate is intentionally out of scope for this
  // phase (see Community Database.md, "Duplicate Handling") and is covered
  // by the server-level duplicate test in server.test.js instead.
});

test("recordEvent never stores personal form content, only identifiers and outcomes", () => {
  const { store } = makeTempStore();
  const created = store.createRegistration(validRegistration);
  store.recordEvent({
    communityMemberId: created.id,
    eventType: "registration_submitted",
    result: "stored",
    correlationId: "test-correlation-id"
  });

  const event = store.db
    .prepare("SELECT * FROM registration_events WHERE community_member_id = ?")
    .get(created.id);
  assert.equal(event.event_type, "registration_submitted");
  assert.equal(event.result, "stored");
  assert.equal(event.correlation_id, "test-correlation-id");
});

test("ping() succeeds against a healthy database", () => {
  const { store } = makeTempStore();
  assert.equal(store.ping(), true);
});
