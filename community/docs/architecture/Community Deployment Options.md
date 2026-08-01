# Community Deployment Options

## Purpose

Compares appropriate production hosting approaches for `community/server/` (the Community registration backend) now that OpenDoorDesign.org is confirmed to be a static site (`CNAME` points to `opendoordesign.org`, consistent with GitHub Pages hosting, which cannot execute Node.js).

This document recommends an approach. It does not select or configure a paid service, and nothing in this document has been deployed. See Decision Log, Decision 010, for the earlier decision that established this same limitation, and Decision Log for the entry recording review of this document.

## Constraints that apply to every option

- `register.html`'s form posts to `api/register`, resolving to `/community/api/register` when the site and the backend share an origin, or to a separate origin plus a full URL if they do not.
- The backend uses `better-sqlite3`, a native module compiled for the host's OS/architecture at install time — this affects which hosting platforms can run it without extra build steps.
- The SQLite database is a single file on disk. Any hosting approach whose disk is not persistent between requests or deployments will lose data unless the database is moved to persistent or networked storage.
- Registration data is personal information; every option must support HTTPS, environment-variable-based secrets (Phase 3), and a real backup procedure (see `Community Data Operations.md`).
- Open Door Design's custom domain (`opendoordesign.org`) is a project requirement to preserve, or replace with an equally clear subdomain (for example `community.opendoordesign.org`).

## Option A - Serverless registration endpoint, public site stays on GitHub Pages

### Deployment structure

The static site (this repository, unchanged in its root and `community/*.html` files) continues to deploy to GitHub Pages. `community/server/server.js`'s single route is reimplemented as one or more serverless functions (for example, a platform's "Functions" or "Edge Functions" feature) deployed separately, reachable at a URL such as `https://api.opendoordesign.org/community/register` or a platform-issued subdomain.

### Required repository changes

- `register.html`'s form `action` changes from the relative `api/register` to the deployed function's absolute URL, since the function does not share an origin with GitHub Pages by default.
- `server.js`'s single Express route needs to be adapted to the target platform's function signature (most serverless platforms accept a plain Express app with minimal changes, but the static-file-serving portion of `server.js` becomes unnecessary here, since GitHub Pages already serves the HTML).
- A CORS policy must be added, since the function's origin differs from `opendoordesign.org`.

### Environment variables

Set through the serverless platform's own environment-variable configuration (not committed to the repository). See Phase 3's `.env.example` for the full list; all of it applies here unchanged.

### SQLite compatibility

This is the weakest fit for SQLite. Most serverless platforms provide no persistent local disk between invocations (or only ephemeral, per-invocation disk that is discarded). `better-sqlite3` would need to either point at a mounted persistent volume (available on some platforms, not all) or be replaced with a networked database for this option specifically.

### Persistent storage limitations

Significant. This is the central tradeoff of Option A: serverless compute is a good fit for a single validation-and-storage endpoint, but a poor fit for SQLite's single-file model unless the platform offers a persistent volume or the storage layer is swapped for a networked database (for example a managed Postgres or SQLite-compatible networked service). Swapping storage is possible without changing the public form, because of the storage interface described in `registrationStore.js`, but it is real work, not a configuration change.

### Custom-domain implications

Requires a second DNS entry (for example a subdomain such as `api.opendoordesign.org`) pointed at the serverless platform, alongside the existing GitHub Pages DNS records for the main domain.

### Accessibility implications

None directly — the public HTML, CSS, and JavaScript do not change. The only user-facing change is the form's `action` URL, which is invisible to a person using the form.

### Estimated operational complexity

Low to moderate once set up: no server to patch or restart, but two deployment targets (GitHub Pages plus the function platform) to keep in sync, and the SQLite persistence question above must be resolved before launch.

### Free-tier or paid-service considerations

Most serverless function platforms offer a free tier sufficient for low registration volume. Persistent storage (if the platform's volume feature is used, or a managed database is added) is more likely to require a paid tier.

### Salesforce migration implications

Neutral to positive: the storage interface (`storage/registrationStore.js`) is unaffected by where the function runs, so swapping in a Salesforce-backed store later is exactly as described in Decision Log, Decision 010, regardless of which hosting option is chosen.

## Option B - A Node-capable host for `community/server`, GitHub Pages continues serving the static site

### Deployment structure

GitHub Pages continues serving the root site and the Community HTML pages unchanged. `community/server/` is deployed as a small, always-on (or scale-to-zero) Node.js service on a host that supports long-running Node processes and persistent or attached disk (for example a small container or virtual machine host, or a platform-as-a-service with a persistent disk add-on), reachable at a subdomain such as `community-api.opendoordesign.org`.

### Required repository changes

Smallest of the three options. `server.js` already serves static files itself, but on this option that responsibility can stay disabled in production (GitHub Pages still serves the HTML) or left as-is for local development; either way, no code changes are required beyond `register.html`'s `action` pointing at the deployed subdomain instead of the relative path, and standard host-specific deployment configuration (for example a `Procfile`, `Dockerfile`, or platform config file).

### Environment variables

Same list as Phase 3's `.env.example`, set through the host's environment-variable or secrets configuration.

### SQLite compatibility

Best fit of the three options, provided the host offers a persistent disk (not all do by default — this must be confirmed and, on some hosts, purchased or attached explicitly). `better-sqlite3` runs exactly as it does locally.

### Persistent storage limitations

Depends entirely on whether the chosen host's disk survives redeploys and restarts. Hosts with ephemeral filesystems reintroduce the same data-loss risk as Option A; hosts with an attached persistent volume do not.

### Custom-domain implications

Requires a subdomain DNS entry pointed at the host, alongside the existing GitHub Pages records for the main domain — same shape as Option A.

### Accessibility implications

None directly, for the same reason as Option A.

### Estimated operational complexity

Moderate: an actual running process exists that can crash, need restarting, or need patching, unlike Option A's function model. In exchange, SQLite behaves exactly as it does in local development, which is the simplest possible path from "reference implementation" to "production," matching this repository's stated preference for the simplest workable implementation.

### Free-tier or paid-service considerations

Persistent-disk hosting is less commonly free than pure serverless compute; expect a modest paid tier for a small always-on service with attached storage, though several hosts offer inexpensive small-instance pricing appropriate for low registration volume.

### Salesforce migration implications

Neutral to positive, same reasoning as Option A.

## Option C - Move the complete site to a host that supports both static files and the backend

### Deployment structure

Both the static OpenDoorDesign.org site and `community/server/` move together to a single host that can serve static files and run Node.js from one deployment (for example a platform that serves a repository's static assets and its backend together, or a Node host configured to serve `express.static(siteRoot)`, which `server.js` already does).

### Required repository changes

Moderate: DNS for the entire `opendoordesign.org` domain (not just a subdomain) moves to the new host, `server.js`'s existing `express.static(siteRoot)` call becomes the production path for the whole site rather than a local-preview convenience, and `register.html`'s `action` can remain the relative `api/register`, since everything shares one origin again — closest to the current reference implementation's assumptions.

### Environment variables

Same list as Phase 3's `.env.example`.

### SQLite compatibility

Same as Option B: good, provided the host's disk is persistent.

### Persistent storage limitations

Same as Option B.

### Custom-domain implications

Largest of the three: the entire domain's DNS moves, not just a new subdomain, which means every existing page's URL, any external links to it, and any search-engine indexing are affected during the transition — this is a bigger, riskier change than adding a subdomain.

### Accessibility implications

None to the pages themselves. Indirect risk: a full domain migration is the most likely of the three options to cause temporary outages or broken links during cutover if not carefully sequenced, and any downtime affects everyone, including assistive technology users who may have less tolerance for confusing failure states.

### Estimated operational complexity

Highest of the three: one platform to manage, but the migration itself is the riskiest step, and it revisits a decision (GitHub Pages hosting the public site) that was not broken and was not part of this feature's request.

### Free-tier or paid-service considerations

Varies by host; likely a paid tier once persistent storage and a custom domain are both required.

### Salesforce migration implications

Neutral, same reasoning as the other options.

## Recommendation

Option B (a Node-capable host for `community/server` only, alongside GitHub Pages continuing to serve the static site) is recommended. It requires the smallest change to the working static site, keeps the SQLite reference implementation exactly as built and already tested (see `Feature 001 Community Registration.md` and the Decision Log), avoids the domain-migration risk in Option C, and avoids Option A's unresolved persistent-storage question for SQLite. A subdomain (for example `community-api.opendoordesign.org`) is the smallest DNS change of the three options that still uses the existing custom domain.

This recommendation is not a decision. Per the request that produced this document, no external hosting service has been selected, purchased, or deployed to. Selecting and paying for a specific host requires Dean's approval; see the Decision Log entry recording this document and Community Roadmap's "Immediate Next Action" for what happens once that approval is given.
