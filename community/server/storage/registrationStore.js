"use strict";

/**
 * Registration storage interface.
 *
 * This file documents the contract every storage backend must implement.
 * The registration route (see ../server.js) only ever calls the methods
 * below — it never touches SQLite, Salesforce, or any other vendor API
 * directly. This is what lets the storage layer be replaced later
 * (Community Roadmap Phase 5, Salesforce Evaluation and Integration)
 * without changing the public registration form or the API contract it
 * submits to.
 *
 * A conforming store must implement:
 *
 * findByNormalizedEmail(emailNormalized: string): RegistrationRecord | null
 *   Look up an existing member by case-insensitive email for duplicate
 *   handling, per Community Database.md's "Duplicate Handling" section.
 *
 * createRegistration(input: RegistrationInput): RegistrationRecord
 *   Insert a new community_members row, its interests / accessibility
 *   perspectives / participation preferences join rows, and a
 *   consent_records row, as a single unit. Must record created_at,
 *   updated_at, source, and status = "pending".
 *
 * recordEvent(event: { communityMemberId: string|null, eventType: string,
 *   result: string, correlationId: string }): void
 *   Append a row to registration_events for operational auditing. Must
 *   never store personal form content — only identifiers and outcomes.
 *
 * ping(): boolean
 *   Optional. Confirms the store is reachable and responsive; used by the
 *   health endpoint (server.js, GET /community/api/health). Should throw
 *   if the store cannot be reached rather than returning false, so the
 *   health endpoint's existing error handling can report the failure.
 *
 * RegistrationInput fields match Feature 001 Community Registration.md:
 *   firstName, lastName, email, aboutYou (optional), interests (array),
 *   accessibilityPerspectives (array), participationPreferences (array),
 *   privacyConsent (boolean), privacyNoticeVersion (string).
 *
 * A future Salesforce-backed store would implement this same interface
 * (e.g. storage/salesforceRegistrationStore.js) and be selected in
 * storage/index.js without any change to server.js, community.js, or the
 * HTML pages.
 */

module.exports = {};
