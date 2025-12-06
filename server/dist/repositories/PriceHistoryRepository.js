"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceHistoryRepository = exports.PriceHistoryRepository = void 0;
const connection_1 = require("../db/connection");
class PriceHistoryRepository {
    /**
     * Get and increment the batch counter atomically
     */
    getNextBatchId() {
        const updateStmt = connection_1.db.prepare(`
      UPDATE batch_counter SET current_batch = current_batch + 1 WHERE id = 1
    `);
        const selectStmt = connection_1.db.prepare(`
      SELECT current_batch FROM batch_counter WHERE id = 1
    `);
        updateStmt.run();
        const result = selectStmt.get();
        return result.current_batch;
    }
    /**
     * Record prices for all beers in a single batch
     */
    recordPrices(prices) {
        const batchId = this.getNextBatchId();
        const stmt = connection_1.db.prepare(`
      INSERT INTO price_history (batch_id, beer_id, price)
      VALUES (?, ?, ?)
    `);
        const insertMany = connection_1.db.transaction((items) => {
            for (const item of items) {
                stmt.run(batchId, item.beerId, item.price);
            }
        });
        insertMany(prices);
    }
    /**
     * Get all price history grouped by beer, ordered by batch
     */
    getAllHistory(limit = 100) {
        // Get prices ordered by batch_id to ensure correct ordering
        const stmt = connection_1.db.prepare(`
      SELECT beer_id as beerId, price, batch_id
      FROM price_history
      ORDER BY batch_id ASC
    `);
        const rows = stmt.all();
        // Group by batch first to get the correct number of data points
        const batchMap = new Map();
        for (const row of rows) {
            if (!batchMap.has(row.batch_id)) {
                batchMap.set(row.batch_id, new Map());
            }
            batchMap.get(row.batch_id).set(row.beerId, row.price);
        }
        // Get sorted batch IDs and limit them
        const sortedBatches = Array.from(batchMap.keys()).sort((a, b) => a - b).slice(0, limit);
        // Build history arrays for each beer
        const history = new Map();
        for (const batchId of sortedBatches) {
            const batchPrices = batchMap.get(batchId);
            batchPrices.forEach((price, beerId) => {
                if (!history.has(beerId)) {
                    history.set(beerId, []);
                }
                history.get(beerId).push(price);
            });
        }
        return history;
    }
    /**
     * Get time labels (timestamps) for the chart
     */
    getTimeLabels(limit = 100) {
        const stmt = connection_1.db.prepare(`
      SELECT batch_id, MIN(timestamp) as timestamp
      FROM price_history
      GROUP BY batch_id
      ORDER BY batch_id ASC
      LIMIT ?
    `);
        const rows = stmt.all(limit);
        return rows.map(r => r.timestamp);
    }
    /**
     * Get the current batch count (number of price snapshots)
     */
    getBatchCount() {
        const stmt = connection_1.db.prepare(`
      SELECT current_batch FROM batch_counter WHERE id = 1
    `);
        const result = stmt.get();
        return result?.current_batch ?? 0;
    }
    /**
     * Delete all price history and reset batch counter
     */
    deleteAll() {
        connection_1.db.prepare('DELETE FROM price_history').run();
        connection_1.db.prepare('UPDATE batch_counter SET current_batch = 0 WHERE id = 1').run();
    }
}
exports.PriceHistoryRepository = PriceHistoryRepository;
exports.priceHistoryRepository = new PriceHistoryRepository();
