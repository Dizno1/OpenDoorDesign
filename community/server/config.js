"use strict";

/**
 * Reads and validates server configuration from environment variables.
 * No secret or environment-specific value is hard-coded anywhere else in
 * this backend — everything configurable lives here. See `.env.example`
 * for the documented list of every variable this module reads.
 *
 * Throws a single, clear error listing every missing required variable if
 * called with NODE_ENV=production and something required is absent, so a
 * misconfigured production deployment fails fast at startup instead of
 * failing confusingly on the first real request.
 *
 * @param {NodeJS.ProcessEnv} [env] Defaults to process.env; a plain object
 *   can be passed instead for testing.
 * @returns {object} The resolved configuration.
 */
function readConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";

  const config = {
    nodeEnv,
    isProduction,
    port: Number(env.PORT) || 4001,
    // When unset, db/init.js falls back to community/server/db/community.db.
    // Production deployments should set this to a path on persistent storage
    // (see Community Deployment Options.md).
    databasePath: env.DATABASE_PATH || null,
    // The public URL this server is reachable at once deployed. Used only
    // for structured startup logging and future email-template links; never
    // used to bypass same-origin behavior.
    publicBaseUrl: env.PUBLIC_BASE_URL || `http://localhost:${Number(env.PORT) || 4001}`,
    email: {
      // "console" is the only implemented provider (Feature 003, Phase 4):
      // it logs the message it would have sent and never claims delivery.
      // A real provider is selected by this same variable once one is
      // configured (see community/server/email/README.md).
      provider: env.EMAIL_PROVIDER || "console",
      fromAddress: env.EMAIL_FROM_ADDRESS || "Accessibility@OpenDoorDesign.org",
      // Provider-specific credentials (for example EMAIL_PROVIDER_API_KEY)
      // are read directly by that provider's module, never here, so this
      // file never holds a secret value even in memory longer than needed.
    },
    rateLimit: {
      windowMs: Number(env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      maxRequests: Number(env.RATE_LIMIT_MAX_REQUESTS) || 20
    }
  };

  const missing = [];
  if (isProduction && !env.PUBLIC_BASE_URL) {
    missing.push("PUBLIC_BASE_URL");
  }
  if (isProduction && !env.DATABASE_PATH) {
    missing.push("DATABASE_PATH");
  }
  if (isProduction && config.email.provider !== "console" && !env.EMAIL_PROVIDER_API_KEY) {
    missing.push("EMAIL_PROVIDER_API_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required production configuration: ${missing.join(", ")}. ` +
      "See community/server/.env.example for what each variable does."
    );
  }

  return config;
}

module.exports = { readConfig };
