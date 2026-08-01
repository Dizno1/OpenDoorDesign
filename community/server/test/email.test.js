"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { ConsoleEmailProvider } = require("../email/consoleEmailProvider");
const { getEmailProvider, sendConfirmationEmail } = require("../email/emailService");
const { renderConfirmationEmail } = require("../email/templates/confirmationEmail");

const testConfig = { email: { provider: "console", fromAddress: "Accessibility@OpenDoorDesign.org" } };

test("confirmation email template produces plain-text and HTML versions", () => {
  const message = renderConfirmationEmail(
    { firstName: "Dean", email: "dean@example.com" },
    testConfig
  );
  assert.equal(message.to, "dean@example.com");
  assert.equal(message.from, "Accessibility@OpenDoorDesign.org");
  assert.match(message.subject, /Community/);
  assert.match(message.text, /Hi Dean,/);
  assert.match(message.html, /<html lang="en">/);
  assert.match(message.html, /Hi Dean,/);
});

test("confirmation email template escapes HTML in the name", () => {
  const message = renderConfirmationEmail(
    { firstName: "<script>alert(1)</script>", email: "a@example.com" },
    testConfig
  );
  assert.ok(!message.html.includes("<script>alert(1)</script>"));
  assert.match(message.html, /&lt;script&gt;/);
});

test("getEmailProvider returns the console provider by default", () => {
  const provider = getEmailProvider(testConfig);
  assert.ok(provider instanceof ConsoleEmailProvider);
});

test("email service success path: console provider never claims delivery", async () => {
  const provider = getEmailProvider(testConfig);
  const result = await sendConfirmationEmail(
    provider,
    { firstName: "Dean", email: "dean@example.com" },
    testConfig
  );
  assert.equal(result.sent, false, "the development provider must never claim delivery");
  assert.equal(result.provider, "console");
});

test("email service failure path: a rejecting provider propagates its rejection", async () => {
  const failingProvider = {
    async send() {
      throw new Error("simulated provider outage");
    }
  };

  await assert.rejects(
    () => sendConfirmationEmail(
      failingProvider,
      { firstName: "Dean", email: "dean@example.com" },
      testConfig
    ),
    /simulated provider outage/
  );
  // server.js is responsible for catching this rejection after storage has
  // already succeeded and recording a "confirmation_email" / "failed"
  // registration_events row without undoing the registration; see
  // Feature 003 Phase 4 and server.js's registration route.
});
