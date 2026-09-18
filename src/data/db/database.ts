import * as SQLite from 'expo-sqlite';

import { MIGRATIONS, SCHEMA_VERSION } from './schema';

export type Database = SQLite.SQLiteDatabase;

export const DATABASE_NAME = 'dogbreeds.db';

/**
 * Opens the database and runs forward-only migrations keyed by
 * `PRAGMA user_version`.
 */
export async function openDatabase(name: string = DATABASE_NAME): Promise<Database> {
  const db = await SQLite.openDatabaseAsync(name);
  // Wait briefly on a lock instead of failing at once (belt and braces:
  // app writes are already serialised by serializeWrite).
  await db.execAsync('PRAGMA busy_timeout = 5000');
  await migrate(db);
  return db;
}

export async function migrate(db: Database): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  while (current < SCHEMA_VERSION) {
    const next = current + 1;
    const sql = MIGRATIONS[next];
    if (!sql) throw new Error(`Missing migration for schema version ${next}`);
    await db.execAsync(sql);
    await db.execAsync(`PRAGMA user_version = ${next}`);
    current = next;
  }
}
