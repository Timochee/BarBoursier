"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = exports.SettingsRepository = void 0;
const connection_1 = require("../db/connection");
const shared_1 = require("shared");
class SettingsRepository {
    getAll() {
        const stmt = connection_1.db.prepare('SELECT key, value FROM settings');
        const rows = stmt.all();
        const settings = { ...shared_1.DEFAULT_SETTINGS };
        for (const row of rows) {
            switch (row.key) {
                case 'base_move':
                    settings.baseMove = row.value;
                    break;
                case 'sector_correlation':
                    settings.sectorCorrelation = row.value;
                    break;
                case 'min_price':
                    settings.minPrice = row.value;
                    break;
                case 'max_price':
                    settings.maxPrice = row.value;
                    break;
            }
        }
        return settings;
    }
    get(key) {
        const stmt = connection_1.db.prepare('SELECT value FROM settings WHERE key = ?');
        const result = stmt.get(key);
        return result?.value;
    }
    set(key, value) {
        const stmt = connection_1.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
        stmt.run(key, value);
    }
}
exports.SettingsRepository = SettingsRepository;
exports.settingsRepository = new SettingsRepository();
