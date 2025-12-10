import type { Beer, PurchaseResult, MarketStats } from 'shared';
import { beerRepository, transactionRepository, priceHistoryRepository, settingsRepository } from '../repositories';
import { PricingService } from './PricingService';
import { beersToRecords } from '../utils/helpers';

export class MarketService {
  private pricingService: PricingService | null = null;

  private getPricingService(): PricingService {
    if (!this.pricingService) {
      const settings = settingsRepository.getAll();
      this.pricingService = new PricingService(settings);
    }
    return this.pricingService;
  }

  buy(beerId: number, quantity: number): PurchaseResult | null {
    const beer = beerRepository.getById(beerId);
    if (!beer) {
      return null;
    }

    const beers = beerRepository.getAll();
    const { updates, impact } = this.getPricingService().calculatePriceChanges(beers, beer, quantity);

    // Update prices in database
    beerRepository.updatePrices(updates);

    // Record transaction
    transactionRepository.create(beerId, quantity, beer.currentPrice);

    // Record price history
    const priceRecords = updates.map(u => ({ beerId: u.id, price: u.price }));
    priceHistoryRepository.recordPrices(priceRecords);

    // Get updated beer
    const updatedBeer = beerRepository.getById(beerId)!;

    return {
      beer: updatedBeer,
      impact,
    };
  }

  reset(): Beer[] {
    // Reset all beer prices to base prices
    beerRepository.resetPrices();

    // Clear transaction history
    transactionRepository.deleteAll();

    // Clear price history
    priceHistoryRepository.deleteAll();

    // Record initial prices
    const beers = beerRepository.getAll();
    priceHistoryRepository.recordPrices(beersToRecords(beers));

    return beers;
  }

  getStats(): MarketStats {
    return {
      totalMarketPrice: beerRepository.getTotalMarketPrice(),
      transactionCount: transactionRepository.getCount(),
    };
  }

  getAllBeers(): Beer[] {
    return beerRepository.getAll();
  }
}

export const marketService = new MarketService();
