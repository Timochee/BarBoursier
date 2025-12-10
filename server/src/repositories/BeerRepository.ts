import { db } from '../db/connection';
import type { Beer } from 'shared';

// SQL constants to avoid repetition (DRY)
const BEER_COLUMNS = `id, name, base_price as basePrice, current_price as currentPrice, category, volatility`;
const SELECT_BEER = `SELECT ${BEER_COLUMNS} FROM beers`;

export class BeerRepository {
  getAll(): Beer[] {
    const stmt = db.prepare(`${SELECT_BEER} ORDER BY category, name`);
    return stmt.all() as Beer[];
  }

  getById(id: number): Beer | undefined {
    const stmt = db.prepare(`${SELECT_BEER} WHERE id = ?`);
    return stmt.get(id) as Beer | undefined;
  }

  getByCategory(category: string): Beer[] {
    const stmt = db.prepare(`${SELECT_BEER} WHERE category = ? ORDER BY name`);
    return stmt.all(category) as Beer[];
  }

  updatePrice(id: number, newPrice: number): void {
    const stmt = db.prepare('UPDATE beers SET current_price = ? WHERE id = ?');
    stmt.run(newPrice, id);
  }

  updatePrices(updates: { id: number; price: number }[]): void {
    const stmt = db.prepare('UPDATE beers SET current_price = ? WHERE id = ?');
    const updateMany = db.transaction((items: { id: number; price: number }[]) => {
      for (const item of items) {
        stmt.run(item.price, item.id);
      }
    });
    updateMany(updates);
  }

  resetPrices(): void {
    const stmt = db.prepare('UPDATE beers SET current_price = base_price');
    stmt.run();
  }

  getTotalMarketPrice(): number {
    const stmt = db.prepare('SELECT SUM(current_price) as total FROM beers');
    const result = stmt.get() as { total: number };
    return result.total;
  }

  create(beer: {
    name: string;
    basePrice: number;
    category: string;
    volatility: number;
  }): Beer {
    const stmt = db.prepare(`
      INSERT INTO beers (name, base_price, current_price, category, volatility)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      beer.name,
      beer.basePrice,
      beer.basePrice, // current_price starts at base_price
      beer.category,
      beer.volatility
    );

    return {
      id: result.lastInsertRowid as number,
      name: beer.name,
      basePrice: beer.basePrice,
      currentPrice: beer.basePrice,
      category: beer.category,
      volatility: beer.volatility,
    };
  }

  update(id: number, beer: {
    name?: string;
    basePrice?: number;
    category?: string;
    volatility?: number;
  }): Beer | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (beer.name !== undefined) {
      updates.push('name = ?');
      values.push(beer.name);
    }
    if (beer.basePrice !== undefined) {
      updates.push('base_price = ?');
      values.push(beer.basePrice);
    }
    if (beer.category !== undefined) {
      updates.push('category = ?');
      values.push(beer.category);
    }
    if (beer.volatility !== undefined) {
      updates.push('volatility = ?');
      values.push(beer.volatility);
    }

    if (updates.length === 0) return existing;

    values.push(id);
    const stmt = db.prepare(`UPDATE beers SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  delete(id: number): boolean {
    // First delete related price history
    const deleteHistory = db.prepare('DELETE FROM price_history WHERE beer_id = ?');
    deleteHistory.run(id);

    // Delete related transactions
    const deleteTransactions = db.prepare('DELETE FROM transactions WHERE beer_id = ?');
    deleteTransactions.run(id);

    // Delete the beer
    const stmt = db.prepare('DELETE FROM beers WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  exists(name: string, excludeId?: number): boolean {
    if (excludeId) {
      const stmt = db.prepare('SELECT 1 FROM beers WHERE LOWER(name) = LOWER(?) AND id != ?');
      return stmt.get(name, excludeId) !== undefined;
    }
    const stmt = db.prepare('SELECT 1 FROM beers WHERE LOWER(name) = LOWER(?)');
    return stmt.get(name) !== undefined;
  }

  getCategories(): string[] {
    const stmt = db.prepare('SELECT DISTINCT category FROM beers ORDER BY category');
    const rows = stmt.all() as { category: string }[];
    return rows.map(r => r.category);
  }

  deleteByCategory(category: string): number {
    // Get all beer IDs in this category
    const beers = this.getByCategory(category);
    const beerIds = beers.map(b => b.id);

    if (beerIds.length === 0) return 0;

    // Delete in a transaction
    const deleteAll = db.transaction(() => {
      for (const id of beerIds) {
        // Delete related price history
        db.prepare('DELETE FROM price_history WHERE beer_id = ?').run(id);
        // Delete related transactions
        db.prepare('DELETE FROM transactions WHERE beer_id = ?').run(id);
      }
      // Delete all beers in category
      const placeholders = beerIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM beers WHERE id IN (${placeholders})`).run(...beerIds);
    });

    deleteAll();
    return beerIds.length;
  }
}

export const beerRepository = new BeerRepository();
