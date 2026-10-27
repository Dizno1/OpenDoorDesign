# Community administrator registration review and daily digest

This update adds a protected member review page at `/community/admin/members` and an authenticated daily digest trigger at `POST /community/admin/digest/run`.

## Existing functionality

The archive already included `/community/admin/` and member CSV export. This update extends that existing administration system. It does not introduce member approval, change member sign-in, or alter the public registration form.

## Configuration

Set `ADMIN_ENABLED=true`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_DIGEST_RECIPIENT` in Railway environment settings. Preserve `DATABASE_PATH`, `EMAIL_PROVIDER=resend`, `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS`, and `PUBLIC_BASE_URL`. Never place secrets in repository files.

The administrator dashboard is protected by the existing HTTP Basic authentication. Use HTTPS. The review action requires an additional signed token and does not change membership status. Reviews are stored in a separate table; existing members appear as New until marked Reviewed.

## Daily schedule

The digest is NOT scheduled automatically by this code. Configure a trusted scheduler to issue exactly one authenticated HTTPS POST to `/community/admin/digest/run` at 8:00 AM America/New_York each day, using the administrator credentials. A scheduler that supports IANA time zones is preferred so DST changes are handled. This is a required deployment step before notifications begin.

The endpoint reports `sent`, `empty`, or `already_sent`. It covers the previous completed Eastern calendar day. Empty days produce no email. Successful digest dates are stored in `community_admin_digest_runs` to avoid repeated daily emails. The email contains a maximum of 20 member names and registration times, a total count, and a link to the protected member review page. Member emails, biographies, and accessibility perspectives are not included in the digest.

If the provider rejects the send, the date remains unsent and a later retry is possible. If an external provider accepts a message but the database write fails, a retry could duplicate the digest; monitor operational logs. To prevent concurrent duplicate sends across multiple replicas, use a single scheduler and a single digest worker.

The member review list displays 100 registrations per page with previous/next links. Member detail shows interests, participation preferences, Directory choice, and biography; accessibility perspectives are intentionally excluded. The review marker does not approve, reject, block, or email a member.

## Validation before public release

1. Deploy to staging using a persistent database and valid Resend configuration.
2. Confirm admin credentials protect all review and digest URLs.
3. Confirm existing members appear and new registrations remain sign-in capable.
4. Mark one test registration Reviewed and verify the status persists after restart.
5. Trigger the digest for a completed day with test registrations, verify one message, and verify a second invocation reports `already_sent`.
6. Verify an empty day produces no message and a provider failure leaves the date available for retry.
7. Configure and verify the actual 8:00 AM Eastern scheduler.

No deployment or scheduler configuration was performed as part of this source update.
