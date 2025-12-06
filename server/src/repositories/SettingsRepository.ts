import { db } from '../db/connection';
import type { Settings } from 'shared';
import { DEFAULT_SETTINGS } from 'shared';

export class SettingsRepository {
  getAll(): Settings {
    const stmt = db.prepare('SELECT key, value FROM settings');
    const rows = stmt.all() as { key: string; value: number }[];

    const settings: Settings = { ...DEFAULT_SETTINGS };
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

  get(key: string): number | undefined {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: number } | undefined;
    return result?.value;
  }

  set(key: string, value: number): void {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }
}

export const settingsRepository = new SettingsRepository();
