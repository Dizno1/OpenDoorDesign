"use strict";

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
    publicBaseUrl:
      env.PUBLIC_BASE_URL ||
      `http://localhost:${Number(env.PORT) || 4001}`,

    email: {
      // "console" remains the development default. Production can select
      // "resend" through EMAIL_PROVIDER.
      provider: env.EMAIL_PROVIDER || "console",

      // Use the Community collaboration address as the default sender.
      // Production may override this with EMAIL_FROM_ADDRESS.
      fromAddress:
        env.EMAIL_FROM_ADDRESS ||
        "Open Door Design Community <Collaborate@community.opendoordesign.org>"

      // Provider-specific credentials such as EMAIL_PROVIDER_API_KEY
      // are read directly by the selected provider module rather than stored
      // in this config object.
    },

    admin: {
      enabled: env.ADMIN_ENABLED === "true",
      username: env.ADMIN_USERNAME || null,
      password: env.ADMIN_PASSWORD || null
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

  if (
    isProduction &&
    config.email.provider !== "console" &&
    !env.EMAIL_PROVIDER_API_KEY
  ) {
    missing.push("EMAIL_PROVIDER_API_KEY");
  }

  if (config.admin.enabled) {
    if (!env.ADMIN_USERNAME) {
      missing.push("ADMIN_USERNAME");
    }

    if (!env.ADMIN_PASSWORD) {
      missing.push("ADMIN_PASSWORD");
    }
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