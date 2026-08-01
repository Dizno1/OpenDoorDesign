"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { readConfig } = require("../config");

test("development defaults require no environment variables", () => {
  const config = readConfig({});
  assert.equal(config.nodeEnv, "development");
  assert.equal(config.isProduction, false);
  assert.equal(config.port, 4001);
  assert.equal(config.email.provider, "console");
});

test("production startup throws a clear error when required variables are missing", () => {
  assert.throws(
    () => readConfig({ NODE_ENV: "production" }),
    /Missing required production configuration: PUBLIC_BASE_URL, DATABASE_PATH/
  );
});

test("production startup throws when a non-console email provider has no API key", () => {
  assert.throws(
    () => readConfig({
      NODE_ENV: "production",
      PUBLIC_BASE_URL: "https://community-api.opendoordesign.org",
      DATABASE_PATH: "/var/data/community.db",
      EMAIL_PROVIDER: "somecommercialprovider"
    }),
    /EMAIL_PROVIDER_API_KEY/
  );
});

test("production startup succeeds once every required variable is present", () => {
  const config = readConfig({
    NODE_ENV: "production",
    PUBLIC_BASE_URL: "https://community-api.opendoordesign.org",
    DATABASE_PATH: "/var/data/community.db",
    PORT: "8080"
  });
  assert.equal(config.isProduction, true);
  assert.equal(config.port, 8080);
  assert.equal(config.databasePath, "/var/data/community.db");
});

test("rate limit values are configurable and fall back to documented defaults", () => {
  const config = readConfig({ RATE_LIMIT_MAX_REQUESTS: "5" });
  assert.equal(config.rateLimit.maxRequests, 5);
  assert.equal(config.rateLimit.windowMs, 15 * 60 * 1000);
});
