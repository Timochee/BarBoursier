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
}
exports.BeerRepository = BeerRepository;
exports.beerRepository = new BeerRepository();
