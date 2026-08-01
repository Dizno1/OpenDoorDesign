# Open Door Design Community Database

## Status

Implemented for Feature 001. SQLite was selected as the initial production database technology (Decision Log, Decision 010) and the schema below is implemented at `community/server/db/schema.sql`, applied automatically by `community/server/db/init.js`. The database file itself is excluded from version control because it holds registrant personal data.

This remains a technology choice for the current volume and hosting stage, not a long-term commitment. The storage layer sits behind an explicit interface (`community/server/storage/registrationStore.js`) so it can be replaced — by Salesforce or another service — without changing the public form.

## Design Goals

- Support secure community registration now.
- Avoid collecting unnecessary personal information.
- Support correction, deletion, export, and consent auditing.
- Preserve a clean migration path to Salesforce.
- Avoid tying the public form to one vendor.

## Recommended Initial Relational Model

### community_members

One record per community member.

Fields:

- `id` unique internal identifier.
- `first_name` required text, maximum 100 characters.
- `last_name` required text, maximum 100 characters.
- `email` required text, maximum 254 characters.
- `email_normalized` required normalized value for duplicate review.
- `about_you` optional text, maximum 2,000 characters.
- `status` required controlled value such as pending, active, unsubscribed, deleted, or blocked.
- `source` required controlled value, initially website_community_registration.
- `created_at` required timestamp.
- `updated_at` required timestamp.
- `deleted_at` optional timestamp for controlled deletion workflow when legally and operationally appropriate.

### interests

Controlled reference values for community interests.

Fields:

- `id` unique identifier.
- `code` stable machine-readable value.
- `label` human-readable value.
- `is_active` boolean.
- `display_order` integer.

### community_member_interests

Join table between members and interests.

Fields:

- `community_member_id`.
- `interest_id`.
- `created_at`.

### accessibility_perspectives

Controlled reference values for voluntarily shared perspectives.

Fields:

- `id` unique identifier.
- `code` stable machine-readable value.
- `label` human-readable value.
- `is_active` boolean.
- `display_order` integer.

### community_member_accessibility_perspectives

Restricted join table between members and voluntarily shared perspectives.

Fields:

- `community_member_id`.
- `accessibility_perspective_id`.
- `created_at`.

Access to this relationship should be more restricted than ordinary interests because it may reveal sensitive personal context.

### participation_preferences

Controlled reference values for ways a member may participate.

Fields:

- `id` unique identifier.
- `code` stable machine-readable value.
- `label` human-readable value.
- `is_active` boolean.
- `display_order` integer.

### community_member_participation_preferences

Join table between members and participation preferences.

Fields:

- `community_member_id`.
- `participation_preference_id`.
- `created_at`.

### consent_records

Auditable record of privacy consent.

Fields:

- `id` unique identifier.
- `community_member_id`.
- `consent_type` controlled value.
- `notice_version` required value.
- `consent_status` granted or withdrawn.
- `recorded_at` required timestamp.
- `source` required value.
- `request_identifier` optional security-safe correlation identifier.

### email_verifications

Optional table if verification is implemented.

Fields:

- `id` unique identifier.
- `community_member_id`.
- `token_hash` required protected value.
- `expires_at` required timestamp.
- `verified_at` optional timestamp.
- `created_at` required timestamp.

Never store a reusable plain-text verification token.

### registration_events

Operational audit events without unnecessary form content.

Fields:

- `id` unique identifier.
- `community_member_id` optional until matching is complete.
- `event_type` controlled value.
- `result` controlled value.
- `created_at` timestamp.
- `correlation_id` security-safe identifier.

Do not use this table as a second copy of personal registration data.

## Duplicate Handling

Email should be normalized for duplicate review, but duplicate handling must not silently overwrite an existing member.

Recommended behavior:

- If an active member submits the same email, update only after explicit confirmation or send a preference-management path.
- If a pending member submits again, resend verification within rate limits.
- If a deleted or blocked record matches, follow documented privacy and security rules rather than automatically restoring it.

## Data Classification

### Standard Personal Data

- Name
- Email address
- About You response
- Interests
- Participation preferences

### Potentially Sensitive Personal Context

- Accessibility perspectives

Access to accessibility perspectives should be limited to people with a legitimate community-operation need. It should not be included casually in exports, dashboards, or broad email lists.

## Retention

Retention periods must be approved before production. The system should support:

- Removal of unverified registrations after a defined period.
- Removal or anonymization after an approved deletion request.
- Preservation of minimal consent withdrawal records when required.
- Documented backup expiration.

Manual procedures for correction, deletion, backup, and restoration — implemented ahead of an automatic retention period, since an administrative interface does not exist yet — are documented in `../operations/Community Data Operations.md`. A specific automatic retention period for inactive members remains undefined and unapproved; see that document's "Record retention" section.

## Export and Salesforce Readiness

The data store must support export using stable identifiers and controlled values.

Recommended export entities:

- Community members
- Interests
- Member interests
- Accessibility perspectives
- Member accessibility perspectives
- Participation preferences
- Member participation preferences
- Consent records

The integration layer should transform these records into the approved Salesforce model later. The website should not submit directly to Salesforce from the browser.

## Technology Selection Criteria

Evaluate each candidate service for:

- Accessibility of the administrative interface.
- Cost at low volume.
- Secure HTTPS APIs.
- Encryption and access controls.
- Backup and restore.
- Data export.
- Deletion support.
- Audit logging.
- Email integration.
- Hosting compatibility with OpenDoorDesign.org.
- Future Salesforce synchronization.
- Vendor lock-in risk.

SQLite is approved as the initial technology for Feature 001 (Decision Log, Decision 010). This criteria list remains the basis for evaluating any future replacement, including a hosted service or Salesforce.
