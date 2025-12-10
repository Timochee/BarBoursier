"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beerRepository = exports.BeerRepository = void 0;
const connection_1 = require("../db/connection");
class BeerRepository {
    getAll() {
        const stmt = connection_1.db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      ORDER BY category, name
    `);
        return stmt.all();
    }
    getById(id) {
        const stmt = connection_1.db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      WHERE id = ?
    `);
        return stmt.get(id);
    }
    getByCategory(category) {
        const stmt = connection_1.db.prepare(`
      SELECT id, name, base_price as basePrice, current_price as currentPrice,
             category, volatility
      FROM beers
      WHERE category = ?
      ORDER BY name
    `);
        return stmt.all(category);
    }
    updatePrice(id, newPrice) {
        const stmt = connection_1.db.prepare('UPDATE beers SET current_price = ? WHERE id = ?');
        stmt.run(newPrice, id);
    }
    updatePrices(updates) {
        const stmt = connection_1.db.prepare('UPDATE beers SET current_price = ? WHERE id = ?');
        const updateMany = connection_1.db.transaction((items) => {
            for (const item of items) {
                stmt.run(item.price, item.id);
            }
        });
        updateMany(updates);
    }
    resetPrices() {
        const stmt = connection_1.db.prepare('UPDATE beers SET current_price = base_price');
        stmt.run();
    }
    getTotalMarketPrice() {
        const stmt = connection_1.db.prepare('SELECT SUM(current_price) as total FROM beers');
        const result = stmt.get();
        return result.total;
    }
    create(beer) {
        const stmt = connection_1.db.prepare(`
      INSERT INTO beers (name, base_price, current_price, category, volatility)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = stmt.run(beer.name, beer.basePrice, beer.basePrice, // current_price starts at base_price
        beer.category, beer.volatility);
        return {
            id: result.lastInsertRowid,
            name: beer.name,
            basePrice: beer.basePrice,
            currentPrice: beer.basePrice,
            category: beer.category,
            volatility: beer.volatility,
        };
    }
    update(id, beer) {
        const existing = this.getById(id);
        if (!existing)
            return undefined;
        const updates = [];
        const values = [];
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
        if (updates.length === 0)
            return existing;
        values.push(id);
        const stmt = connection_1.db.prepare(`UPDATE beers SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        return this.getById(id);
    }
    delete(id) {
        // First delete related price history
        const deleteHistory = connection_1.db.prepare('DELETE FROM price_history WHERE beer_id = ?');
        deleteHistory.run(id);
        // Delete related transactions
        const deleteTransactions = connection_1.db.prepare('DELETE FROM transactions WHERE beer_id = ?');
        deleteTransactions.run(id);
        // Delete the beer
        const stmt = connection_1.db.prepare('DELETE FROM beers WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    exists(name, excludeId) {
        if (excludeId) {
            const stmt = connection_1.db.prepare('SELECT 1 FROM beers WHERE LOWER(name) = LOWER(?) AND id != ?');
            return stmt.get(name, excludeId) !== undefined;
        }
        const stmt = connection_1.db.prepare('SELECT 1 FROM beers WHERE LOWER(name) = LOWER(?)');
        return stmt.get(name) !== undefined;
    }
    getCategories() {
        const stmt = connection_1.db.prepare('SELECT DISTINCT category FROM beers ORDER BY category');
        const rows = stmt.all();
        return rows.map(r => r.category);
    }
    deleteByCategory(category) {
        // Get all beer IDs in this category
        const beers = this.getByCategory(category);
        const beerIds = beers.map(b => b.id);
        if (beerIds.length === 0)
            return 0;
        // Delete in a transaction
        const deleteAll = connection_1.db.transaction(() => {
            for (const id of beerIds) {
                // Delete related price history
                connection_1.db.prepare('DELETE FROM price_history WHERE beer_id = ?').run(id);
                // Delete related transactions
                connection_1.db.prepare('DELETE FROM transactions WHERE beer_id = ?').run(id);
            }
            // Delete all beers in category
            const placeholders = beerIds.map(() => '?').join(',');
            connection_1.db.prepare(`DELETE FROM beers WHERE id IN (${placeholders})`).run(...beerIds);
        });
        deleteAll();
        return beerIds.length;
    }
}
exports.BeerRepository = BeerRepository;
exports.beerRepository = new BeerRepository();
