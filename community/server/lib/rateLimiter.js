"use strict";

/**
 * Minimal in-memory, IP-keyed sliding-window rate limiter.
 *
 * Deliberately dependency-free: a small hand-written limiter is enough for
 * a single-instance deployment (Community Deployment Options.md, Option B,
 * the recommended approach) and avoids adding a package for something this
 * small. It does NOT coordinate across multiple server instances or
 * serverless invocations — if the chosen hosting approach ever scales to
 * more than one instance, this must be replaced with a shared store (for
 * example Redis-backed) rather than assumed to still work correctly.
 *
 * This never blocks a legitimate assistive technology user on its own: it
 * only limits the number of requests from one address in a time window, the
 * same way it would for any browser, and does not distinguish based on
 * anything about how the form was operated.
 */
function createRateLimiter({ windowMs, maxRequests }) {
  const hitsByKey = new Map();

  function rateLimiter(request, response, next) {
    const key = request.ip || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentHits = (hitsByKey.get(key) || []).filter((timestamp) => timestamp > windowStart);
    recentHits.push(now);
    hitsByKey.set(key, recentHits);

    if (recentHits.length > maxRequests) {
      response.set("Retry-After", String(Math.ceil(windowMs / 1000)));
      response.status(429).type("text").send("Too many requests. Please try again later.");
      return;
    }

    next();
  }

  // Exposed for tests and for operational visibility; not used by the
  // request-handling path above.
  rateLimiter.reset = () => hitsByKey.clear();

  return rateLimiter;
}

module.exports = { createRateLimiter };
