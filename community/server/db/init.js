"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DEFAULT_DB_PATH = path.join(__dirname, "community.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

/**
 * Open (creating if necessary) the Community SQLite database and apply the
 * schema. Safe to call on every server start: every statement in schema.sql
 * uses IF NOT EXISTS / INSERT OR IGNORE.
 *
 * @param {string} [dbPath] Path to the SQLite file. Defaults to
 *   community/server/db/community.db, which is intentionally excluded from
 *   version control (see .gitignore) because it holds registrant personal data.
 * @returns {import("better-sqlite3").Database}
 */
function initDatabase(dbPath = DEFAULT_DB_PATH) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  return db;
}

module.exports = { initDatabase, DEFAULT_DB_PATH };
