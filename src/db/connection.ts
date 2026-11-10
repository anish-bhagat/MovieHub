import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || env.DATABASE_PATH;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  
  // Enable foreign keys and WAL mode for better concurrency and durability
  db.exec('PRAGMA foreign_keys = ON;');
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  // Auto-initialize schema
  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
  }

  // Safe migration for snacks column
  try {
    db.exec("ALTER TABLE bookings ADD COLUMN snacks TEXT NOT NULL DEFAULT '[]';");
  } catch {
    // Column already exists
  }

  // Safe migration for blocked_seats column
  try {
    db.exec("ALTER TABLE showtimes ADD COLUMN blocked_seats TEXT NOT NULL DEFAULT '[]';");
  } catch {
    // Column already exists
  }

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
