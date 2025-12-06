import type { ChartData, Beer } from 'shared';
import { beerRepository, priceHistoryRepository, transactionRepository } from '../repositories';

export class ChartDataService {
  getChartData(): ChartData {
    const beers = beerRepository.getAll();
    const timeLabels = priceHistoryRepository.getTimeLabels();
    const beerPriceHistory = priceHistoryRepository.getAllHistory();

    // Calculate sector price history (average prices per category)
    const sectorPriceHistory: Record<string, number[]> = {};
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
    const beerPriceHistoryRecord: Record<number, number[]> = {};
    beerPriceHistory.forEach((prices, beerId) => {
      beerPriceHistoryRecord[beerId] = prices;
    });

    return {
      timeLabels,
      sectorPriceHistory,
      beerPriceHistory: beerPriceHistoryRecord,
      transactionCount: transactionRepository.getCount(),
    };
  }

  initializeHistory(): void {
    const beers = beerRepository.getAll();
    const existingLabels = priceHistoryRepository.getTimeLabels();

    if (existingLabels.length === 0) {
      // Record initial prices
      const priceRecords = beers.map(b => ({ beerId: b.id, price: b.currentPrice }));
      priceHistoryRepository.recordPrices(priceRecords);
    }
  }
}

export const chartDataService = new ChartDataService();
