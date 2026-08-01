"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateRegistration, checkSpamSignals } = require("../lib/validate");

test("empty registration produces one error for every required field", () => {
  const { valid, errors } = validateRegistration({});
  assert.equal(valid, false);
  const fields = errors.map((error) => error.field);
  assert.deepEqual(fields, ["first-name", "last-name", "email", "privacy-agreement"]);
});

test("empty email produces the empty-field message, not the format message", () => {
  const { errors } = validateRegistration({ first_name: "A", last_name: "B" });
  const emailError = errors.find((error) => error.field === "email");
  assert.equal(emailError.message, "Enter your email address.");
});

test("malformed but non-empty email produces the format message", () => {
  const { valid, errors } = validateRegistration({
    first_name: "A",
    last_name: "B",
    email: "not-an-email",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30"
  });
  assert.equal(valid, false);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].field, "email");
  assert.equal(errors[0].message, "Enter an email address in a valid format.");
});

test("missing privacy confirmation produces exactly one error for that field", () => {
  const { valid, errors } = validateRegistration({
    first_name: "A",
    last_name: "B",
    email: "a@example.com"
  });
  assert.equal(valid, false);
  const privacyErrors = errors.filter((error) => error.field === "privacy-agreement");
  assert.equal(privacyErrors.length, 1, "privacy-agreement must produce exactly one error, never two");
});

test("a fully valid submission produces no errors", () => {
  const { valid, errors } = validateRegistration({
    first_name: "Dean",
    last_name: "Testworthy",
    email: "dean@example.com",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30"
  });
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test("only allow-listed checkbox values are kept", () => {
  const { value } = validateRegistration({
    first_name: "A",
    last_name: "B",
    email: "a@example.com",
    privacy_consent: "agreed",
    privacy_notice_version: "2026-07-30",
    interests: ["Accessibility education", "<script>alert(1)</script>"]
  });
  assert.deepEqual(value.interests, ["Accessibility education"]);
});

test("honeypot field filled in is flagged as suspicious", () => {
  const result = checkSpamSignals({ middle_name: "a bot filled this in" });
  assert.equal(result.suspicious, true);
  assert.equal(result.reason, "honeypot_filled");
});

test("empty honeypot field with no timing field is not suspicious (fails open)", () => {
  const result = checkSpamSignals({ middle_name: "" });
  assert.equal(result.suspicious, false);
});

test("submitting faster than a human can is flagged as suspicious", () => {
  const result = checkSpamSignals({ middle_name: "", form_rendered_at: String(Date.now()) });
  assert.equal(result.suspicious, true);
  assert.equal(result.reason, "submitted_too_quickly");
});

test("submitting after a reasonable delay is not suspicious", () => {
  const renderedAt = Date.now() - 5000;
  const result = checkSpamSignals({ middle_name: "", form_rendered_at: String(renderedAt) });
  assert.equal(result.suspicious, false);
});
