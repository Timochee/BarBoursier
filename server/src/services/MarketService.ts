import type { Beer, PurchaseResult, MarketStats } from 'shared';
import { beerRepository, transactionRepository, priceHistoryRepository, settingsRepository } from '../repositories';
import { PricingService } from './PricingService';
import { beersToRecords } from '../utils/helpers';

export class MarketService {
  // Create fresh PricingService each time to ensure settings are up-to-date
  // Settings can be changed via admin UI, so we need to read them fresh
  private createPricingService(): PricingService {
    const settings = settingsRepository.getAll();
    return new PricingService(settings);
  }

  buy(beerId: number, quantity: number): PurchaseResult | null {
    const beer = beerRepository.getById(beerId);
    if (!beer) {
      return null;
    }

    const beers = beerRepository.getAll();
    const { updates, impact } = this.createPricingService().calculatePriceChanges(beers, beer, quantity);

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
