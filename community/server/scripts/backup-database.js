"use strict";

/**
 * Copies the live Community SQLite database (and its WAL/SHM companion
 * files, if present) to a timestamped file under db/backups/, which is
 * excluded from version control. See
 * ../../docs/operations/Community Data Operations.md, "Database backup".
 *
 * Usage: node community/server/scripts/backup-database.js
 * Optional: DATABASE_PATH=/path/to/community.db node scripts/backup-database.js
 */

const fs = require("fs");
const path = require("path");

const { DEFAULT_DB_PATH } = require("../db/init");

function backup() {
  const sourcePath = process.env.DATABASE_PATH || DEFAULT_DB_PATH;

  if (!fs.existsSync(sourcePath)) {
    console.error(`[backup] No database file found at ${sourcePath}. Nothing to back up.`);
    process.exitCode = 1;
    return;
  }

  const backupsDir = path.join(path.dirname(sourcePath), "backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = path.basename(sourcePath);

  const filesToCopy = [sourcePath, `${sourcePath}-wal`, `${sourcePath}-shm`].filter(fs.existsSync);

  filesToCopy.forEach((filePath) => {
    const suffix = path.basename(filePath).slice(baseName.length); // "" or "-wal"/"-shm"
    const destination = path.join(backupsDir, `${baseName}.${timestamp}${suffix}`);
    fs.copyFileSync(filePath, destination);
    console.log(`[backup] Copied ${filePath} -> ${destination}`);
  });

  console.log(`[backup] Backup complete: ${filesToCopy.length} file(s) copied to ${backupsDir}`);
}

if (require.main === module) {
  backup();
}

module.exports = { backup };
