"use strict";

/**
 * These tests require `express` and `better-sqlite3`, installed via
 * `npm install` in this folder. They were written and reviewed for
 * correctness in this session but could not be executed here: this sandbox
 * has no network access, so `npm install` cannot fetch either package (see
 * Feature 003 Community Registration Production Readiness.md, "Testing").
 * Run `npm install && npm test` locally or in CI to execute them.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { readConfig } = require("../config");
const { buildApp } = require("../server");
const { initDatabase } = require("../db/init");
const { SqliteRegistrationStore } = require("../storage/sqliteRegistrationStore");

function makeTestServer(overrides = {}) {
  const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "community-server-test-")), "test.db");
  const db = initDatabase(dbPath);
  const store = new SqliteRegistrationStore(db);
  const config = readConfig({
    RATE_LIMIT_MAX_REQUESTS: "1000",
    ...overrides
  });
  const app = buildApp(config, store);
  return { app, store, config };
}

async function startListening(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test("GET /community/api/health returns 200 when the database is reachable", async () => {
  const { app } = makeTestServer();
  const server = await startListening(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/community/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.checks.database, "ok");

  server.close();
});

test("POST with an empty body returns 400 with field-level errors and no error summary", async () => {
  const { app } = makeTestServer();
  const server = await startListening(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: ""
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.ok(!html.includes('id="error-summary"'), "the removed error summary must not reappear");
  assert.match(html, /Enter your first name\./);
  assert.match(html, /autofocus/);

  server.close();
});

test("a fully valid submission stores the registration and redirects to welcome.html", async () => {
  const { app, store } = makeTestServer();
  const server = await startListening(app);
  const { port } = server.address();

  const body = new URLSearchParams({
    first_name: "Dean",
    last_name: "Testworthy",
    email: "dean@example.com",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30",
    form_rendered_at: String(Date.now() - 5000)
  });

  const response = await fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    redirect: "manual"
  });

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/community/welcome.html");

  const member = store.findByNormalizedEmail("dean@example.com");
  assert.ok(member, "the registration should be stored");

  server.close();
});

test("submitting the honeypot field rejects without storing a registration", async () => {
  const { app, store } = makeTestServer();
  const server = await startListening(app);
  const { port } = server.address();

  const body = new URLSearchParams({
    first_name: "Bot",
    last_name: "Submission",
    email: "bot@example.com",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30",
    middle_name: "filled in by a script"
  });

  const response = await fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  assert.equal(response.status, 400);
  assert.equal(store.findByNormalizedEmail("bot@example.com"), null);

  server.close();
});

test("a second submission with the same active email does not create a duplicate", async () => {
  const { app, store } = makeTestServer();
  const server = await startListening(app);
  const { port } = server.address();

  const body = new URLSearchParams({
    first_name: "Dean",
    last_name: "Testworthy",
    email: "dupe@example.com",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30",
    form_rendered_at: String(Date.now() - 5000)
  });

  await fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    redirect: "manual"
  });

  // Manually mark the first registration active, since new registrations
  // start "pending" and duplicate suppression only applies to "active"
  // members (Community Database.md, "Duplicate Handling").
  store.db.prepare("UPDATE community_members SET status = 'active' WHERE email_normalized = ?").run("dupe@example.com");

  await fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    redirect: "manual"
  });

  const count = store.db
    .prepare("SELECT COUNT(*) AS count FROM community_members WHERE email_normalized = ?")
    .get("dupe@example.com");
  assert.equal(count.count, 1, "a second submission for an active member must not create a duplicate row");

  server.close();
});

test("requests over the configured rate limit receive 429", async () => {
  const { app } = makeTestServer({ RATE_LIMIT_MAX_REQUESTS: "1" });
  const server = await startListening(app);
  const { port } = server.address();

  const makeRequest = () => fetch(`http://127.0.0.1:${port}/community/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: ""
  });

  await makeRequest();
  const secondResponse = await makeRequest();

  assert.equal(secondResponse.status, 429);

  server.close();
});
