import { db } from '../db/connection';

export class PriceHistoryRepository {
  /**
   * Get and increment the batch counter atomically
   */
  private getNextBatchId(): number {
    const updateStmt = db.prepare(`
      UPDATE batch_counter SET current_batch = current_batch + 1 WHERE id = 1
    `);
    const selectStmt = db.prepare(`
      SELECT current_batch FROM batch_counter WHERE id = 1
    `);

    updateStmt.run();
    const result = selectStmt.get() as { current_batch: number };
    return result.current_batch;
  }

  /**
   * Record prices for all beers in a single batch
   */
  recordPrices(prices: { beerId: number; price: number }[]): void {
    const batchId = this.getNextBatchId();
    const stmt = db.prepare(`
      INSERT INTO price_history (batch_id, beer_id, price)
      VALUES (?, ?, ?)
    `);
    const insertMany = db.transaction((items: { beerId: number; price: number }[]) => {
      for (const item of items) {
        stmt.run(batchId, item.beerId, item.price);
      }
    });
    insertMany(prices);
  }

  /**
   * Get all price history grouped by beer, ordered by batch
   */
  getAllHistory(limit: number = 100): Map<number, number[]> {
    // Get prices ordered by batch_id to ensure correct ordering
    const stmt = db.prepare(`
      SELECT beer_id as beerId, price, batch_id
      FROM price_history
      ORDER BY batch_id ASC
    `);
    const rows = stmt.all() as { beerId: number; price: number; batch_id: number }[];

    // Group by batch first to get the correct number of data points
    const batchMap = new Map<number, Map<number, number>>();
    for (const row of rows) {
      if (!batchMap.has(row.batch_id)) {
        batchMap.set(row.batch_id, new Map());
      }
      batchMap.get(row.batch_id)!.set(row.beerId, row.price);
    }

    // Get sorted batch IDs and limit them
    const sortedBatches = Array.from(batchMap.keys()).sort((a, b) => a - b).slice(0, limit);

    // Build history arrays for each beer
    const history = new Map<number, number[]>();
    for (const batchId of sortedBatches) {
      const batchPrices = batchMap.get(batchId)!;
      batchPrices.forEach((price, beerId) => {
        if (!history.has(beerId)) {
          history.set(beerId, []);
        }
        history.get(beerId)!.push(price);
      });
    }

    return history;
  }

  /**
   * Get time labels (batch numbers) for the chart
   */
  getTimeLabels(limit: number = 100): string[] {
    const stmt = db.prepare(`
      SELECT DISTINCT batch_id
      FROM price_history
      ORDER BY batch_id ASC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as { batch_id: number }[];
    return rows.map(r => String(r.batch_id));
  }

  /**
   * Get the current batch count (number of price snapshots)
   */
  getBatchCount(): number {
    const stmt = db.prepare(`
      SELECT current_batch FROM batch_counter WHERE id = 1
    `);
    const result = stmt.get() as { current_batch: number } | undefined;
    return result?.current_batch ?? 0;
  }

  /**
   * Delete all price history and reset batch counter
   */
  deleteAll(): void {
    db.prepare('DELETE FROM price_history').run();
    db.prepare('UPDATE batch_counter SET current_batch = 0 WHERE id = 1').run();
  }
}

export const priceHistoryRepository = new PriceHistoryRepository();
