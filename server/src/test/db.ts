import { db, initializeDatabase } from '../db/connection';

// Recreates a clean schema on the in-memory database used by tests
export function resetDatabase(): void {
  initializeDatabase();
  db.exec(`
    DELETE FROM transactions;
    DELETE FROM price_history;
    DELETE FROM beers;
    UPDATE batch_counter SET current_batch = 0 WHERE id = 1;
  `);
}
