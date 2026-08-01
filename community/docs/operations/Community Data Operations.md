# Community Data Operations

## Purpose

Documents the initial operational procedures for Community registration data. No automated administrative interface exists yet (Community Roadmap, Phase 3, "Community Operations"), so every procedure below is manual. This document is the source of truth until that interface exists.

## Record retention

**Procedure:** Retain an active `community_members` record indefinitely while the member remains engaged, unless they request deletion (see "Deletion requests" below) or become inactive per a retention period Open Door Design has not yet defined.

**Status:** A specific retention period (for example, "delete after N years of no activity") has not yet been set. This is a known gap; see "Remaining production blockers" in `Feature 003 Community Registration Production Readiness.md`. Until a period is defined, no automatic deletion happens — records are retained and only removed on request or by manual administrative action.

## Correction requests

**Procedure:**
1. The member emails `Accessibility@OpenDoorDesign.org` (or another established Open Door Design contact) describing the correction needed, per the Community Privacy Notice (`community/privacy.html`).
2. Whoever receives the request confirms the requester's identity is reasonably consistent with the record being corrected (for example, the request comes from the same email address on file, or the member can otherwise confirm which record is theirs).
3. Using a SQLite client (for example the `sqlite3` CLI, or any SQLite GUI) against the deployed `community.db` file, run an `UPDATE` statement against the specific `community_members` row, changing only the field(s) requested. Never bulk-edit multiple members from one request.
4. Update `updated_at` on the row to the current timestamp as part of the same statement.
5. Reply to the member confirming the correction was made.

Example:

```sql
UPDATE community_members
SET first_name = 'CorrectedName', updated_at = '2026-08-01T00:00:00.000Z'
WHERE id = 'the-members-id';
```

## Deletion requests

**Procedure:**
1. The member emails `Accessibility@OpenDoorDesign.org` requesting deletion, per the Community Privacy Notice.
2. Confirm the requester's identity as in "Correction requests" above.
3. Two options, chosen based on whether Open Door Design needs to retain a record that the member existed (for example, to honor an email-suppression request) without keeping their personal data:
   - **Full deletion:** delete the `community_members` row and its related join-table rows (`community_member_interests`, `community_member_accessibility_perspectives`, `community_member_participation_preferences`) and `consent_records` rows.
   - **Soft deletion (preferred when in doubt):** set `status = 'deleted'`, set `deleted_at` to the current timestamp, and clear `about_you`. This satisfies "stop using this data" while leaving an auditable trail that a request was honored, without retaining the content of any optional response.
4. Reply to the member confirming the deletion.

Example (soft deletion):

```sql
UPDATE community_members
SET status = 'deleted', deleted_at = '2026-08-01T00:00:00.000Z', about_you = NULL, updated_at = '2026-08-01T00:00:00.000Z'
WHERE id = 'the-members-id';
```

**Status:** A specific choice between full and soft deletion as the default has not been made by Dean. Soft deletion is used as the example above because it is reversible if a request turns out to be mistaken; this default should be confirmed, not assumed permanent.

## Duplicate registrations

**Automatic behavior (already implemented):** `server.js` checks `findByNormalizedEmail` before creating a registration. If a member with that normalized email already has `status = 'active'`, no second row is created, and the visitor is redirected to the same welcome page as a successful registration, per `Community Database.md`, "Duplicate Handling."

**Manual gap:** A duplicate submission for a `pending` (not yet `active`) member is not currently detected — a second `community_members` row can be created. Until an administrative interface exists, periodically check for this manually:

```sql
SELECT email_normalized, COUNT(*) AS registrations
FROM community_members
GROUP BY email_normalized
HAVING COUNT(*) > 1;
```

Resolve any duplicates found by keeping the earliest row and soft-deleting the later one(s), preserving each row's `consent_records` for audit purposes.

## Registration-event retention

`registration_events` rows are operational audit records (never personal form content — only identifiers, event types, and outcomes; see `registrationStore.js`). Retain them for at least as long as the `community_members` row they reference exists, to support troubleshooting and the duplicate-detection query above. There is no current automatic pruning; if the table grows large enough to matter, prune rows older than a defined window (for example one year) rather than deleting all history at once.

## Consent-record preservation

`consent_records` rows must never be deleted as part of an ordinary correction, and should be preserved even through a full deletion where legally and practically reasonable, because they are the evidence that consent was given (or withdrawn) at a specific time under a specific privacy notice version. If a full deletion is chosen for a member (see "Deletion requests"), consider retaining a minimal consent record (timestamp, notice version, and a note that the associated member data was later deleted) rather than removing all trace that consent was ever recorded.

## Database backup

**Procedure:** `community/server/scripts/backup-database.js` copies the live SQLite file (including its WAL and SHM companion files, if present) to a timestamped file under `community/server/db/backups/`, which is excluded from version control (see `.gitignore`).

```
node community/server/scripts/backup-database.js
```

Run this on a regular schedule once the server is deployed (for example, a daily cron job or the hosting platform's scheduled-task feature — the specific schedule depends on the hosting approach chosen in `Community Deployment Options.md`), and additionally before any manual correction or deletion procedure above, so a mistake is recoverable.

**Status:** No automatic schedule exists yet; running the script is currently a manual step. Set one up as part of the hosting deployment described in `Community Deployment Options.md`.

## Database restoration

**Procedure:**
1. Stop the running server process (a restore while the database is open risks corruption).
2. Identify the correct backup file under `community/server/db/backups/` by its timestamp.
3. Copy that backup file to the configured `DATABASE_PATH` (or the default `community/server/db/community.db`), overwriting the current file. If WAL/SHM companion files exist for that backup, copy them too, and delete any stale WAL/SHM files left over from the file being replaced.
4. Restart the server and confirm `GET /community/api/health` returns `"status": "ok"`.
5. Spot-check a known record (for example, a recent test registration) to confirm the restored data looks correct.

Restoration has not been rehearsed against a real production deployment yet, since no production deployment exists (see `Community Deployment Options.md`). Rehearse this procedure once hosting is selected and before relying on it in a real incident.
