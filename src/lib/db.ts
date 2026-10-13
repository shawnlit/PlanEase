import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'planease.db');
const SCHEMA_PATH = path.resolve(process.cwd(), 'db', 'schema.sql');
const VIEWS_PATH = path.resolve(process.cwd(), 'db', 'views.sql');

interface GlobalWithDb {
  __planeaseDb?: Database.Database;
  __planeaseInitialized?: boolean;
}

const globalForDb = globalThis as unknown as GlobalWithDb;

function initializeDatabase(db: Database.Database): void {
  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Enable WAL mode for concurrency and performance
    db.pragma('journal_mode = WAL');

    // Read and execute schema definition
    if (fs.existsSync(SCHEMA_PATH)) {
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      db.exec(schemaSql);
    } else {
      console.warn(`[PlanEase DB] Schema file not found at: ${SCHEMA_PATH}`);
    }

    // Read and execute views definition
    if (fs.existsSync(VIEWS_PATH)) {
      const viewsSql = fs.readFileSync(VIEWS_PATH, 'utf-8');
      db.exec(viewsSql);
    } else {
      console.warn(`[PlanEase DB] Views file not found at: ${VIEWS_PATH}`);
    }
  } catch (err) {
    console.error('[PlanEase DB] Initialization error:', err);
    throw err;
  }
}

export function getDb(): Database.Database {
  if (globalForDb.__planeaseDb) {
    return globalForDb.__planeaseDb;
  }

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);

  // Initialize schema and views once per process
  if (!globalForDb.__planeaseInitialized) {
    initializeDatabase(db);
    globalForDb.__planeaseInitialized = true;
  }

  globalForDb.__planeaseDb = db;
  return db;
}

export default getDb;
