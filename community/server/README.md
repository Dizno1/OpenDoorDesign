# Community Registration Server

Backend for Community Registration (Feature 001) and production readiness (Feature 003). Implements the POST endpoint, server-side validation, SQLite storage, consent recording, a health endpoint, rate limiting, and an email-provider abstraction described in:

- `../docs/architecture/Community Architecture.md`
- `../docs/architecture/Community Database.md`
- `../docs/architecture/Community Deployment Options.md`
- `../docs/operations/Community Data Operations.md`
- `../docs/features/Feature 001 Community Registration.md`
- `../docs/features/Feature 003 Community Registration Production Readiness.md`

## Running locally

```
cd community/server
npm install
cp .env.example .env   # optional; defaults work for local development
npm start
```

This starts an Express server on port 4001 (override with `PORT`) that serves the entire OpenDoorDesign site as static files and handles `POST /community/api/register` and `GET /community/api/health`. Visiting `http://localhost:4001/community/register.html` exercises the real, storage-backed registration flow.

The database file is created automatically at `db/community.db` on first run and is excluded from version control because it holds registrant personal data (see `.gitignore`).

## Configuration

Every configuration value is read from an environment variable by `config.js`; see `.env.example` for the complete, documented list (`PORT`, `DATABASE_PATH`, `PUBLIC_BASE_URL`, `EMAIL_PROVIDER`, `EMAIL_FROM_ADDRESS`, `EMAIL_PROVIDER_API_KEY`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`). Development has sensible defaults for all of them. Setting `NODE_ENV=production` enforces that `PUBLIC_BASE_URL` and `DATABASE_PATH` are set, and that an email provider credential exists if a non-`console` provider is configured — the server logs one clear error listing everything missing and exits rather than starting in a half-configured state.

No secret value is ever committed to this repository. `.env` is excluded by `.gitignore`.

## Health endpoint

`GET /community/api/health` checks database connectivity and returns `{"status": "ok", "checks": {"database": "ok"}}` with a 200, or a 503 with `"status": "unavailable"` if the database cannot be reached. Use this for uptime monitoring once deployed.

## Rate limiting

`lib/rateLimiter.js` is a small, dependency-free, in-memory, per-IP limiter applied to the registration endpoint (defaults: 20 requests per 15-minute window, both configurable). It is honeypot- and timing-check-friendly — it limits by request volume only and never distinguishes based on how the form was operated, so it does not create a barrier for assistive technology users.

**Important limitation:** this limiter's state lives in the process's memory. It works correctly for a single server instance (the recommended hosting approach in `Community Deployment Options.md`) but does not coordinate across multiple instances or serverless invocations. If the eventual hosting approach scales beyond one instance, replace this with a shared store (for example Redis-backed) before relying on it.

## Email

`email/` contains the confirmation-email abstraction. Development can use `consoleEmailProvider.js`; production uses `resendEmailProvider.js` with `EMAIL_PROVIDER=resend` and the provider credential supplied only through the deployment environment. Successful production registrations send the Community confirmation message from `Collaborate@community.opendoordesign.org`. See `email/README.md` for the provider interface and implementation details.

## Production hosting

OpenDoorDesign.org continues to serve the public static site while Railway hosts the Node.js Community backend. The production registration path is live and has successfully stored registrations and delivered confirmation email. `GET /community/api/health` remains the service health check. Deployment secrets and provider credentials belong only in Railway environment variables and are never committed to this repository.

## Storage abstraction

`storage/registrationStore.js` documents the interface. `storage/sqliteRegistrationStore.js` is the current implementation. `storage/index.js` is the only file that selects which implementation is active — a future Salesforce-backed store would be wired in there, and nowhere else, so the public form and API contract never need to change.

## Testing

```
npm install
npm test              # everything
npm run test:offline  # only the tests that need no external package
```

Tests live in `test/` and use Node's built-in test runner (`node:test`) — no new test-framework dependency. `validate.test.js`, `rateLimiter.test.js`, `config.test.js`, and `email.test.js` need no external package. `storage.test.js` and `server.test.js` need `express` and `better-sqlite3` installed via `npm install`.

## Backups

```
node scripts/backup-database.js
```

Copies the live database (and its WAL/SHM files, if present) to a timestamped file under `db/backups/` (excluded from version control). See `../docs/operations/Community Data Operations.md` for the full backup and restoration procedure.

## Remaining production and growth work

- A rate limiter that coordinates across more than one server instance if the service is scaled beyond the current single-instance design.
- An automatic, approved data-retention period (manual correction and deletion procedures exist; see `../docs/operations/Community Data Operations.md`).
- Continued production privacy/security review and cross-assistive-technology test recording.
- Real member authentication and connected Dashboard/profile functionality.
