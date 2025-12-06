import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/barboursier.db');
const INIT_SQL_PATH = path.join(__dirname, 'init.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
  const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');
  db.exec(initSql);
  console.log('Database initialized');
}

export function closeDatabase(): void {
  db.close();
}
