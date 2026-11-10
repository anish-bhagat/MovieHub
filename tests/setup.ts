import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/db/seed.js';

export function createTestContext() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');

  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);

  seedDatabase(db);
  const app = createApp(db);

  return { db, app };
}
