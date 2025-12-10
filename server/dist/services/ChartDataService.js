"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartDataService = exports.ChartDataService = void 0;
const repositories_1 = require("../repositories");
class ChartDataService {
    getChartData() {
        const beers = repositories_1.beerRepository.getAll();
        const timeLabels = repositories_1.priceHistoryRepository.getTimeLabels();
        const beerPriceHistory = repositories_1.priceHistoryRepository.getAllHistory();
        // Calculate sector price history (average prices per category)
        const sectorPriceHistory = {};
        const sectors = [...new Set(beers.map(b => b.category))];
        // Get the max history length
        const maxLength = Math.max(...Array.from(beerPriceHistory.values()).map(h => h.length), 0);
        for (const sector of sectors) {
            sectorPriceHistory[sector] = [];
            const sectorBeers = beers.filter(b => b.category === sector);
            // For each time point, calculate average price of beers that have data at that point
            for (let i = 0; i < maxLength; i++) {
                let sectorTotal = 0;
                let beersWithData = 0;
                for (const beer of sectorBeers) {
                    const history = beerPriceHistory.get(beer.id) || [];
                    // Calculate the offset - beer history starts at (maxLength - history.length)
                    const beerStartIndex = maxLength - history.length;
                    // Only include this beer if the current time point (i) is >= when this beer started
                    if (i >= beerStartIndex && history.length > 0) {
                        const historyIndex = i - beerStartIndex;
                        sectorTotal += history[historyIndex];
                        beersWithData++;
                    }
                }
                // Only add a data point if we have beers with data
                if (beersWithData > 0) {
                    const average = sectorTotal / beersWithData;
                    sectorPriceHistory[sector].push(Math.round(average * 100) / 100);
                }
                else {
                    // No data for this sector at this time point - use null
                    sectorPriceHistory[sector].push(null);
                }
            }
        }
        // Convert Map to Record for beerPriceHistory, padding with null for missing early entries
        const beerPriceHistoryRecord = {};
        // Include ALL current beers, not just those with history
        for (const beer of beers) {
            const prices = beerPriceHistory.get(beer.id) || [];
            const paddedPrices = [];
            const missingCount = maxLength - prices.length;
            // Pad the beginning with null if this beer was added later
            for (let i = 0; i < missingCount; i++) {
                paddedPrices.push(null);
            }
            paddedPrices.push(...prices);
            // If beer has no history at all, add current price as the last point
            if (prices.length === 0 && maxLength > 0) {
                paddedPrices[maxLength - 1] = beer.currentPrice;
            }
            beerPriceHistoryRecord[beer.id] = paddedPrices;
        }
        return {
            timeLabels,
            sectorPriceHistory,
            beerPriceHistory: beerPriceHistoryRecord,
            transactionCount: repositories_1.transactionRepository.getCount(),
        };
    }
    initializeHistory() {
        const beers = repositories_1.beerRepository.getAll();
        const existingLabels = repositories_1.priceHistoryRepository.getTimeLabels();
        if (existingLabels.length === 0) {
            // Record initial prices
            const priceRecords = beers.map(b => ({ beerId: b.id, price: b.currentPrice }));
            repositories_1.priceHistoryRepository.recordPrices(priceRecords);
        }
    }
}
exports.ChartDataService = ChartDataService;
exports.chartDataService = new ChartDataService();
