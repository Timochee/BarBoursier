"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRepository = exports.TransactionRepository = void 0;
const connection_1 = require("../db/connection");
class TransactionRepository {
    getAll() {
        const stmt = connection_1.db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      ORDER BY t.timestamp DESC
    `);
        return stmt.all();
    }
    getRecent(limit = 50) {
        const stmt = connection_1.db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      ORDER BY t.timestamp DESC
      LIMIT ?
    `);
        return stmt.all(limit);
    }
    create(beerId, quantity, unitPrice) {
        const totalPrice = unitPrice * quantity;
        const stmt = connection_1.db.prepare(`
      INSERT INTO transactions (beer_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?)
    `);
        const result = stmt.run(beerId, quantity, unitPrice, totalPrice);
        const getStmt = connection_1.db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      WHERE t.id = ?
    `);
        return getStmt.get(result.lastInsertRowid);
    }
    getCount() {
        const stmt = connection_1.db.prepare('SELECT COUNT(*) as count FROM transactions');
        const result = stmt.get();
        return result.count;
    }
    deleteAll() {
        const stmt = connection_1.db.prepare('DELETE FROM transactions');
        stmt.run();
    }
}
exports.TransactionRepository = TransactionRepository;
exports.transactionRepository = new TransactionRepository();
