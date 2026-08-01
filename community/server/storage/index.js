"use strict";

const { initDatabase } = require("../db/init");
const { SqliteRegistrationStore } = require("./sqliteRegistrationStore");

/**
 * Returns the active registration store.
 *
 * This is the single point where storage technology is selected. Feature 001
 * uses SQLite (see Decision Log, Decision 010). A future Salesforce-backed
 * store can be introduced here — for example by branching on an environment
 * variable — without any change to server.js, community.js, or the public
 * HTML pages, because both stores implement the same interface described in
 * registrationStore.js.
 *
 * @param {{ databasePath?: string|null }} [config] From config.js. When
 *   databasePath is unset, db/init.js falls back to its own default path
 *   (community/server/db/community.db).
 */
function getRegistrationStore(config = {}) {
  const db = config.databasePath ? initDatabase(config.databasePath) : initDatabase();
  return new SqliteRegistrationStore(db);
}

module.exports = { getRegistrationStore };
