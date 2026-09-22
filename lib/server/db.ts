import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/* SQLite for local development. Every query in repo.ts is plain SQL with bound
   parameters, so moving to Postgres means swapping this module and the three
   SQLite-specific pragmas below — not rewriting the data layer. */

const DATA_DIR = process.env.BONTRACO_DATA_DIR ?? path.join(process.cwd(), "storage");
const DB_PATH = path.join(DATA_DIR, "bontraco.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");

  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  database.exec(schema);

  _db = database;
  return database;
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

export function now() {
  return new Date().toISOString();
}

/** SQLite has no boolean type; these keep the intent visible at call sites. */
export const bool = (v: boolean) => (v ? 1 : 0);
export const unbool = (v: number | null | undefined) => v === 1;
