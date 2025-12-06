import { db } from '../db/connection';
import type { Transaction } from 'shared';

export class TransactionRepository {
  getAll(): Transaction[] {
    const stmt = db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      ORDER BY t.timestamp DESC
    `);
    return stmt.all() as Transaction[];
  }

  getRecent(limit: number = 50): Transaction[] {
    const stmt = db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      ORDER BY t.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Transaction[];
  }

  create(beerId: number, quantity: number, unitPrice: number): Transaction {
    const totalPrice = unitPrice * quantity;
    const stmt = db.prepare(`
      INSERT INTO transactions (beer_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(beerId, quantity, unitPrice, totalPrice);

    const getStmt = db.prepare(`
      SELECT t.id, t.beer_id as beerId, b.name as beerName, t.quantity,
             t.timestamp, t.unit_price as unitPrice, t.total_price as totalPrice
      FROM transactions t
      JOIN beers b ON t.beer_id = b.id
      WHERE t.id = ?
    `);
    return getStmt.get(result.lastInsertRowid) as Transaction;
  }

  getCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  deleteAll(): void {
    const stmt = db.prepare('DELETE FROM transactions');
    stmt.run();
  }
}

export const transactionRepository = new TransactionRepository();
