import { db } from '../db/connection';
import { beerRepository, presetRepository } from '../repositories';
import { getSocketIO } from '../socket';
import type { Beer, Preset } from 'shared';

export class PresetService {
  /**
   * Load a preset by ID, replacing all current beers
   * Returns the new beer list or null if preset not found
   */
  loadPreset(id: number): { preset: Preset; beers: Beer[] } | null {
    const preset = presetRepository.getById(id);
    if (!preset) {
      return null;
    }

    // Use transaction to ensure atomic operation
    const loadPresetTx = db.transaction(() => {
      // Clear all existing data
      db.prepare('DELETE FROM price_history').run();
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM beers').run();
      db.prepare('UPDATE batch_counter SET current_batch = 0 WHERE id = 1').run();

      // Insert beers from preset
      const insertBeer = db.prepare(`
        INSERT INTO beers (name, base_price, current_price, category, volatility)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const beer of preset.beers) {
        insertBeer.run(beer.name, beer.basePrice, beer.basePrice, beer.category, beer.volatility);
      }

      // Record initial price history
      const beers = beerRepository.getAll();
      const insertHistory = db.prepare(`
        INSERT INTO price_history (batch_id, beer_id, price)
        VALUES (0, ?, ?)
      `);
      for (const beer of beers) {
        insertHistory.run(beer.id, beer.currentPrice);
      }
    });

    loadPresetTx();

    // Get updated beers
    const beers = beerRepository.getAll();

    // Emit update to all clients
    const io = getSocketIO();
    if (io) {
      io.emit('pricesUpdated', beers);
      io.emit('marketReset');
    }

    return { preset, beers };
  }
}

export const presetService = new PresetService();
