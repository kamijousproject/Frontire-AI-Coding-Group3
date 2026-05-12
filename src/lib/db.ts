/**
 * SQLite DB Singleton
 * Process-level singleton for better-sqlite3. Uses global.__db to survive
 * Next.js HMR in development without leaking file descriptors.
 * Opens read-only with fileMustExist — throws loudly at startup if cities.db is absent.
 */

import Database from 'better-sqlite3';
import path from 'path';

// process.cwd() is used (not __dirname) because App Router compiles handlers into
// .next/server/app/... where __dirname points to the compiled output directory,
// not the project root. process.cwd() always resolves to the project root in both
// dev and Railway.
const DB_PATH = path.join(process.cwd(), 'data', 'cities.db');

declare global {
  // eslint-disable-next-line no-var
  var __db: InstanceType<typeof Database> | undefined;
}

/**
 * Return the process-level better-sqlite3 Database instance.
 * Opens and caches on first call; subsequent calls return the cached handle.
 */
export function getDb(): InstanceType<typeof Database> {
  if (!global.__db) {
    global.__db = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
    });
    const count = (global.__db.prepare('SELECT COUNT(*) as n FROM cities').get() as { n: number }).n;
    console.log(`[db] cities.db opened: ${count} rows`);
  }
  return global.__db;
}
