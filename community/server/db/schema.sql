-- Open Door Design Community — initial SQLite schema.
-- Mirrors community/docs/architecture/Community Database.md.
-- SQLite was selected as the first production data store because it is a
-- lightweight, file-based, zero-configuration relational database that
-- satisfies Feature 001 volume needs and exports cleanly to a future
-- Salesforce integration (see Decision Log, Decision 010).

CREATE TABLE IF NOT EXISTS community_members (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL,
  about_you TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'unsubscribed', 'deleted', 'blocked')),
  source TEXT NOT NULL DEFAULT 'website_community_registration',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_members_email_normalized
  ON community_members (email_normalized);

CREATE TABLE IF NOT EXISTS interests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_member_interests (
  community_member_id TEXT NOT NULL REFERENCES community_members (id),
  interest_id TEXT NOT NULL REFERENCES interests (id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (community_member_id, interest_id)
);

CREATE TABLE IF NOT EXISTS accessibility_perspectives (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Access to this table should be more restricted than ordinary interests,
-- per Community Database.md, because it may reveal sensitive personal context.
CREATE TABLE IF NOT EXISTS community_member_accessibility_perspectives (
  community_member_id TEXT NOT NULL REFERENCES community_members (id),
  accessibility_perspective_id TEXT NOT NULL REFERENCES accessibility_perspectives (id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (community_member_id, accessibility_perspective_id)
);

CREATE TABLE IF NOT EXISTS participation_preferences (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_member_participation_preferences (
  community_member_id TEXT NOT NULL REFERENCES community_members (id),
  participation_preference_id TEXT NOT NULL REFERENCES participation_preferences (id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (community_member_id, participation_preference_id)
);

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  community_member_id TEXT NOT NULL REFERENCES community_members (id),
  consent_type TEXT NOT NULL DEFAULT 'community_privacy_notice',
  notice_version TEXT NOT NULL,
  consent_status TEXT NOT NULL CHECK (consent_status IN ('granted', 'withdrawn')),
  recorded_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website_community_registration',
  request_identifier TEXT
);

-- Reserved for a future release. Not populated until email verification is
-- implemented (Community Roadmap, Phase 2 remaining work).
CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  community_member_id TEXT NOT NULL REFERENCES community_members (id),
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registration_events (
  id TEXT PRIMARY KEY,
  community_member_id TEXT,
  event_type TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL
);

-- Reference data seeded from Feature 001's allowed initial values.
INSERT OR IGNORE INTO interests (id, code, label, is_active, display_order) VALUES
  ('int-01', 'accessibility_education', 'Accessibility education', 1, 1),
  ('int-02', 'accessibility_engineering', 'Accessibility engineering', 1, 2),
  ('int-03', 'screen_reader_testing', 'Screen reader testing', 1, 3),
  ('int-04', 'document_accessibility', 'Document accessibility', 1, 4),
  ('int-05', 'web_and_mobile_accessibility', 'Web and mobile accessibility', 1, 5),
  ('int-06', 'media_accessibility', 'Media accessibility', 1, 6),
  ('int-07', 'artificial_intelligence', 'Artificial intelligence', 1, 7),
  ('int-08', 'research_and_collaboration', 'Research and collaboration', 1, 8);

INSERT OR IGNORE INTO accessibility_perspectives (id, code, label, is_active, display_order) VALUES
  ('perspective-01', 'screen_reader_user', 'Screen reader user', 1, 1),
  ('perspective-02', 'keyboard_first_user', 'Keyboard-first user', 1, 2),
  ('perspective-03', 'low_vision_or_magnification_user', 'Low vision or magnification user', 1, 3),
  ('perspective-04', 'voice_input_user', 'Voice input user', 1, 4),
  ('perspective-05', 'deaf_or_hard_of_hearing', 'Deaf or hard of hearing', 1, 5),
  ('perspective-06', 'cognitive_accessibility', 'Cognitive accessibility', 1, 6),
  ('perspective-07', 'accessibility_professional', 'Accessibility professional', 1, 7),
  ('perspective-08', 'developer_or_designer_learning_accessibility', 'Developer or designer learning accessibility', 1, 8),
  ('perspective-09', 'prefer_not_to_say', 'Prefer not to say', 1, 9);

INSERT OR IGNORE INTO participation_preferences (id, code, label, is_active, display_order) VALUES
  ('participation-01', 'learn_through_the_academy', 'Learn through the Academy', 1, 1),
  ('participation-02', 'test_innovation_lab_projects', 'Test Innovation Lab projects', 1, 2),
  ('participation-03', 'share_accessibility_feedback', 'Share accessibility feedback', 1, 3),
  ('participation-04', 'join_research_studies', 'Join research studies', 1, 4),
  ('participation-05', 'volunteer', 'Volunteer', 1, 5),
  ('participation-06', 'explore_partnerships', 'Explore partnerships', 1, 6),
  ('participation-07', 'receive_project_updates', 'Receive project updates', 1, 7);
