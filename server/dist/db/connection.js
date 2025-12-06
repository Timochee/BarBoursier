"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '../../data/barboursier.db');
const INIT_SQL_PATH = path_1.default.join(__dirname, 'init.sql');
// Ensure data directory exists
const dataDir = path_1.default.dirname(DB_PATH);
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
exports.db = new better_sqlite3_1.default(DB_PATH);
exports.db.pragma('journal_mode = WAL');
function initializeDatabase() {
    const initSql = fs_1.default.readFileSync(INIT_SQL_PATH, 'utf-8');
    exports.db.exec(initSql);
    console.log('Database initialized');
}
function closeDatabase() {
    exports.db.close();
}
