import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize SQLite database with WAL mode for better concurrent read performance.
 * 
 * Design decisions:
 * - `amount_cents` stored as INTEGER to avoid floating-point money errors.
 *   All amounts are in the smallest currency unit (paise for INR, cents for USD).
 * - `idempotency_key` column with UNIQUE constraint enables safe client retries.
 *   If a client sends the same request twice (network retry, page reload), we
 *   return the existing record instead of creating a duplicate.
 * - `created_at` defaults to current UTC timestamp for audit trail.
 * - WAL journal mode allows concurrent reads while writing.
 */
export function createDatabase(dbPath) {
  const resolvedPath = dbPath || path.join(__dirname, "..", "data", "expenses.db");

  // Ensure data directory exists (synchronous to run before DB constructor)
  const dir = path.dirname(resolvedPath);
  fs.mkdirSync(dir, { recursive: true });

  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");
  // Enforce foreign keys
  db.pragma("foreign_keys = ON");

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT UNIQUE,
      amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_idempotency ON expenses(idempotency_key);
  `);

  return db;
}

// Singleton for production use
let _db = null;

export function getDatabase() {
  if (!_db) {
    _db = createDatabase();
  }
  return _db;
}

export function closeDatabase() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
