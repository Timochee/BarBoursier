import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {logger} from '../logger';

const DB_PATH = process.env.NODE_ENV === 'production'
    ? '/app/data/barboursier.db'
    : path.join(__dirname, '../../data/barboursier.db');
const INIT_SQL_PATH = path.join(__dirname, 'init.sql');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {recursive: true});
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function initializeDatabase(): void {
    const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf-8');
    db.exec(initSql);
    logger.info({path: DB_PATH}, 'Database initialized');
}

export function closeDatabase(): void {
    db.close();
    logger.info('Database closed');
}
