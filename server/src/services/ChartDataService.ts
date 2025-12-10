import type { ChartData, Beer } from 'shared';
import { beerRepository, priceHistoryRepository, transactionRepository } from '../repositories';

export class ChartDataService {
  getChartData(): ChartData {
    const beers = beerRepository.getAll();
    const timeLabels = priceHistoryRepository.getTimeLabels();
    const beerPriceHistory = priceHistoryRepository.getAllHistory();

    // Calculate sector price history (average prices per category)
    const sectorPriceHistory: Record<string, (number | null)[]> = {};
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
          // Only include beers that have data at this time point
          if (history.length > i) {
            sectorTotal += history[i];
            beersWithData++;
          }
        }

        // Only add a data point if we have beers with data
        if (beersWithData > 0) {
          const average = sectorTotal / beersWithData;
          sectorPriceHistory[sector].push(Math.round(average * 100) / 100);
        } else {
          // No data for this sector at this time point - use null
          sectorPriceHistory[sector].push(null);
        }
      }
    }

    // Convert Map to Record for beerPriceHistory, padding with null for missing early entries
    const beerPriceHistoryRecord: Record<number, (number | null)[]> = {};
    beerPriceHistory.forEach((prices, beerId) => {
      // Pad the beginning with null if this beer was added later
      const paddedPrices: (number | null)[] = [];
      const missingCount = maxLength - prices.length;
      for (let i = 0; i < missingCount; i++) {
        paddedPrices.push(null);
      }
      paddedPrices.push(...prices);
      beerPriceHistoryRecord[beerId] = paddedPrices;
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
