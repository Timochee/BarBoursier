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
        for (const sector of sectors) {
            sectorPriceHistory[sector] = [];
            const sectorBeers = beers.filter(b => b.category === sector);
            const beerCount = sectorBeers.length;
            // For each time point, calculate average price of beers in this sector
            const maxLength = Math.max(...Array.from(beerPriceHistory.values()).map(h => h.length), 0);
            for (let i = 0; i < maxLength; i++) {
                let sectorTotal = 0;
                for (const beer of sectorBeers) {
                    const history = beerPriceHistory.get(beer.id) || [];
                    sectorTotal += history[i] ?? beer.currentPrice;
                }
                const average = beerCount > 0 ? sectorTotal / beerCount : 0;
                sectorPriceHistory[sector].push(Math.round(average * 100) / 100);
            }
        }
        // Convert Map to Record for beerPriceHistory
        const beerPriceHistoryRecord = {};
        beerPriceHistory.forEach((prices, beerId) => {
            beerPriceHistoryRecord[beerId] = prices;
        });
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
