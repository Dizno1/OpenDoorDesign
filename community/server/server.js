"use strict";

const path = require("path");
const crypto = require("crypto");
const express = require("express");

const { readConfig } = require("./config");
const { getRegistrationStore } = require("./storage");
const { validateRegistration, checkSpamSignals } = require("./lib/validate");
const { renderRegisterPageWithErrors } = require("./lib/renderRegisterPage");
const { createRateLimiter } = require("./lib/rateLimiter");
const { getEmailProvider, sendConfirmationEmail } = require("./email/emailService");

/**
 * Builds the Express app. Kept separate from the app.listen() call below so
 * tests can create an app against a temporary database and configuration
 * without binding a real port. See ../../test/ for usage.
 *
 * @param {ReturnType<typeof readConfig>} config
 * @param {ReturnType<typeof getRegistrationStore>} [store] Optional
 *   override, used by tests to inject a store backed by a temporary
 *   database instead of the default one.
 */
function buildApp(config, store = getRegistrationStore(config)) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));

  // Serve the static Community pages and shared site assets so this server
  // can run as a self-contained local preview. In production, per
  // Community Deployment Options.md, this static-serving behavior is not
  // required — GitHub Pages continues to serve the HTML directly — but
  // leaving it enabled is harmless and keeps local development simple.
  const siteRoot = path.join(__dirname, "..", "..");
  app.use(express.static(siteRoot));

  const emailProvider = getEmailProvider(config);
  const registrationRateLimiter = createRateLimiter(config.rateLimit);

  app.get("/community/api/health", (request, response) => {
    try {
      store.ping();
      response.status(200).json({
        status: "ok",
        environment: config.nodeEnv,
        checks: { database: "ok" }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[community-health] database check failed:", error);
      response.status(503).json({
        status: "unavailable",
        environment: config.nodeEnv,
        checks: { database: "unreachable" }
      });
    }
  });

  app.post("/community/api/register", registrationRateLimiter, async (request, response) => {
    const correlationId = crypto.randomUUID();
    const spamSignal = checkSpamSignals(request.body);

    if (spamSignal.suspicious) {
      // Do not reveal to an automated submitter which signal caught it, and
      // do not display a false success message to a person. Log the
      // technical detail without exposing it, per Feature 001, "System
      // Failure".
      store.recordEvent({
        communityMemberId: null,
        eventType: "registration_submitted",
        result: `rejected_${spamSignal.reason}`,
        correlationId
      });
      response.status(400).type("html").send(
        renderRegisterPageWithErrors(
          [{ field: "first-name", message: "We could not process that submission. Please try again." }],
          {}
        )
      );
      return;
    }

    const { valid, errors, value } = validateRegistration(request.body);

    if (!valid) {
      store.recordEvent({
        communityMemberId: null,
        eventType: "registration_submitted",
        result: "rejected_validation",
        correlationId
      });
      response.status(400).type("html").send(renderRegisterPageWithErrors(errors, value));
      return;
    }

    const existing = store.findByNormalizedEmail(value.emailNormalized);
    if (existing && (existing.status === "active" || existing.status === "pending")) {
      // Never attempt a second insert for an email that is already active or
      // pending. Active members must not be silently overwritten. Duplicate
      // submissions return the same neutral welcome experience without creating
      // another row or sending another confirmation email.
      store.recordEvent({
        communityMemberId: existing.id,
        eventType: "registration_submitted",
        result: existing.status === "active"
          ? "duplicate_active_member"
          : "duplicate_pending_member",
        correlationId
      });
      response.redirect(303, "https://opendoordesign.org/community/welcome.html");
      return;
    }

    let created;
    try {
      created = store.createRegistration(value);
      store.recordEvent({
        communityMemberId: created.id,
        eventType: "registration_submitted",
        result: "stored",
        correlationId
      });
    } catch (error) {
      store.recordEvent({
        communityMemberId: null,
        eventType: "registration_submitted",
        result: "storage_failure",
        correlationId
      });
      // eslint-disable-next-line no-console
      console.error(`[community-registration] storage failure (${correlationId}):`, error);
      response.status(500).type("html").send(
        renderRegisterPageWithErrors(
          [{
            field: "first-name",
            message: "Registration was not completed because of a technical problem. Please try again, or contact Info@OpenDoorDesign.org."
          }],
          value
        )
      );
      return;
    }

    // Storage already succeeded at this point. An email failure below must
    // never undo the registration or change what the visitor sees — it is
    // only ever logged and recorded, per Feature 003, Phase 4.
    try {
      const emailResult = await sendConfirmationEmail(
        emailProvider,
        { firstName: value.firstName, email: value.email },
        config
      );
      store.recordEvent({
        communityMemberId: created.id,
        eventType: "confirmation_email",
        result: emailResult.sent ? "sent" : `not_sent_${emailResult.provider}`,
        correlationId
      });
    } catch (emailError) {
      store.recordEvent({
        communityMemberId: created.id,
        eventType: "confirmation_email",
        result: "failed",
        correlationId
      });
      // eslint-disable-next-line no-console
      console.error(`[community-registration] confirmation email failed (${correlationId}):`, emailError);
    }

    response.redirect(303, "https://opendoordesign.org/community/welcome.html");
  });

  return app;
}

function start() {
  let config;
  try {
    config = readConfig();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[community-server] startup failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const app = buildApp(config);

  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[community-server] listening on port ${config.port} ` +
      `(environment: ${config.nodeEnv}, public URL: ${config.publicBaseUrl})`
    );
  });
}

if (require.main === module) {
  start();
}

module.exports = { buildApp, start };