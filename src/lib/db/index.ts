import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "forum.db");

const globalForDb = globalThis as unknown as { __sqlite?: Database.Database };

function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      uri TEXT PRIMARY KEY, did TEXT NOT NULL, rkey TEXT NOT NULL,
      title TEXT NOT NULL, description TEXT, publication TEXT,
      published_at TEXT, indexed_at TEXT NOT NULL, cover_image_cid TEXT,
      record TEXT NOT NULL, word_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published_at);
    CREATE INDEX IF NOT EXISTS posts_did_idx ON posts (did);

    CREATE TABLE IF NOT EXISTS comments (
      uri TEXT PRIMARY KEY, did TEXT NOT NULL, rkey TEXT NOT NULL,
      subject TEXT NOT NULL, parent TEXT, plaintext TEXT NOT NULL,
      facets TEXT, quoted_text TEXT, attachment TEXT,
      created_at TEXT NOT NULL, indexed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS comments_subject_idx ON comments (subject);
    CREATE INDEX IF NOT EXISTS comments_did_idx ON comments (did);

    CREATE TABLE IF NOT EXISTS votes (
      uri TEXT PRIMARY KEY, did TEXT NOT NULL, subject TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS votes_subject_idx ON votes (subject);
    CREATE INDEX IF NOT EXISTS votes_did_idx ON votes (did);

    CREATE TABLE IF NOT EXISTS publications (
      uri TEXT PRIMARY KEY, did TEXT NOT NULL, rkey TEXT NOT NULL,
      name TEXT NOT NULL, description TEXT, record TEXT NOT NULL, indexed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS publications_did_idx ON publications (did);

    CREATE TABLE IF NOT EXISTS profiles (
      did TEXT PRIMARY KEY, handle TEXT, display_name TEXT, avatar TEXT, pds TEXT, fetched_at TEXT
    );
    CREATE TABLE IF NOT EXISTS auth_state (key TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS auth_session (key TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ingest_cursor (id INTEGER PRIMARY KEY, time_us INTEGER NOT NULL);
  `);
  // lightweight migrations for existing databases
  for (const stmt of [
    "ALTER TABLE comments ADD COLUMN quoted_text TEXT",
    "ALTER TABLE comments ADD COLUMN attachment TEXT",
  ]) {
    try {
      sqlite.exec(stmt);
    } catch {
      // column already exists
    }
  }
  return sqlite;
}

const sqlite = globalForDb.__sqlite ?? createDb();
globalForDb.__sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
export * as tables from "./schema";
