# Community registration digest: individual delivery tracking

The existing authenticated endpoint `POST /community/admin/digest/run` is unchanged. Keep the existing GitHub Actions workflow, administrator secrets, and Railway settings. No new environment variables are needed.

Each daily run selects up to 20 registrations that (1) have not been marked Reviewed, (2) have not previously been included in a successfully accepted digest, and (3) are not deleted. Selection is oldest first, regardless of registration date. If more than 20 qualify, the remainder are eligible for subsequent daily runs.

After the email provider confirms acceptance, the server records a per-member `sent_at` entry in `community_admin_digest_deliveries`. Those registrations will not be included again. If the provider rejects the send, no delivery records are created, and the same registrations remain eligible for retry. The response is `sent` with the count, or `empty` when there is nothing to report. Existing `community_admin_digest_runs` records are retained for historical purposes but no longer control selection.

Sent and Reviewed are separate concepts. Sending a digest does not mark a registration Reviewed, approve membership, or change sign-in access. An already Reviewed registration is excluded from the digest even if it has never been reported. The existing member review page continues to display review status independently.

The email lists member names and registration timestamps and links to the protected review page. It excludes member email addresses, biographies, and accessibility perspectives.

## Deployment and verification

1. Copy the supplied `community/server` files into the existing repository, preserving paths. Commit and push to deploy on Railway. Do not replace unrelated files.
2. Keep the existing GitHub Actions scheduler and its two repository secrets unchanged.
3. After Railway reports an active deployment, manually run Community registration digest in GitHub Actions once.
4. Confirm the email lists previously unreported, unreviewed registrations, including registrations from earlier dates. Confirm the already Reviewed registration is absent.
5. Run it a second time: it should return `empty` and send no second email (unless a new registration arrived).
6. Check that manually reviewing a member remains independent of Sent tracking.

Important limitation: the provider's `sent` confirmation indicates acceptance, not guaranteed inbox delivery. If the provider accepts an email but the subsequent database write fails, a retry could resend it. Use only one scheduler/worker to avoid concurrent requests. The change does not attempt to retroactively infer individual delivery records from historical date-based digest runs.
