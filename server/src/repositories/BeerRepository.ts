import { db } from '../db/connection';
import type { Beer } from 'shared';

export class BeerRepository {
  getAll(): Beer[] {
    const stmt = db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      ORDER BY category, name
    `);
    return stmt.all() as Beer[];
  }

  getById(id: number): Beer | undefined {
    const stmt = db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      WHERE id = ?
    `);
    return stmt.get(id) as Beer | undefined;
  }

  getByCategory(category: string): Beer[] {
    const stmt = db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      WHERE category = ?
      ORDER BY name
    `);
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
}

export const beerRepository = new BeerRepository();
