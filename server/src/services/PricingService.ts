import type { Beer, Settings, PurchaseImpact } from 'shared';
import {
  SECTOR_MATRIX,
  SECTOR_REVERSION_MULTIPLIERS,
  MEAN_REVERSION_BASE_STRENGTH,
  MAX_DECREASE_RATIO,
} from 'shared';

// Internal types for price calculation
interface BeerResult {
  beer: Beer;
  newPrice: number;
  change: number;
}

interface PriceContext {
  updates: { id: number; price: number }[];
  sectorChanges: Record<string, number>;
  beerChanges: Record<string, Record<string, number>>;
  totalActualIncrease: number;
}

export class PricingService {
  constructor(private settings: Settings) {}

  /**
   * Calculate all price changes after a beer purchase
   * Ensures zero-sum market using a two-pass approach
   */
  calculatePriceChanges(
    beers: Beer[],
    purchasedBeer: Beer,
    quantity: number
  ): { updates: { id: number; price: number }[]; impact: PurchaseImpact } {
    // Initialize context
    const ctx = this.initializeContext(beers);

    // Calculate base increase for purchased beer
    const purchasedEffectiveVol = this.calculateEffectiveVolatility(purchasedBeer);
    const rawPriceIncrease = this.settings.baseMove * purchasedEffectiveVol * purchasedBeer.currentPrice * Math.sqrt(quantity);

    // Calculate correlated increases for same-sector beers
    const sameSectorBeers = beers.filter(b => b.category === purchasedBeer.category && b.id !== purchasedBeer.id);
    const correlatedIncreases = this.calculateCorrelatedIncreases(sameSectorBeers, rawPriceIncrease, purchasedEffectiveVol);

    // Calculate decrease weights for other sector beers
    const otherSectorBeers = beers.filter(b => b.category !== purchasedBeer.category);
    const { weights: decreaseWeights, totalWeight } = this.calculateDecreaseWeights(otherSectorBeers, purchasedBeer);

    // Apply increases (purchased beer + same sector)
    this.applyPurchasedBeerIncrease(ctx, purchasedBeer, rawPriceIncrease);
    this.applySameSectorIncreases(ctx, sameSectorBeers, correlatedIncreases);

    // Calculate decreases for other sectors (first pass)
    const otherBeerResults = this.calculateDecreases(otherSectorBeers, decreaseWeights, totalWeight, ctx.totalActualIncrease);

    // Balance to achieve zero-sum (second pass)
    this.balanceZeroSum(otherBeerResults, ctx.totalActualIncrease);

    // Finalize other beer updates
    this.finalizeOtherBeerUpdates(ctx, otherBeerResults);

    return {
      updates: ctx.updates,
      impact: {
        purchasedBeerName: purchasedBeer.name,
        quantity,
        sectorChanges: ctx.sectorChanges,
        beerChanges: ctx.beerChanges,
      },
    };
  }

  // --- Private helper methods (extracted for KISS) ---

  private initializeContext(beers: Beer[]): PriceContext {
    const sectorChanges: Record<string, number> = {};
    const beerChanges: Record<string, Record<string, number>> = {};
    const sectors = [...new Set(beers.map(b => b.category))];
    sectors.forEach(s => { sectorChanges[s] = 0; beerChanges[s] = {}; });

    return { updates: [], sectorChanges, beerChanges, totalActualIncrease: 0 };
  }

  private calculateCorrelatedIncreases(
    sameSectorBeers: Beer[],
    rawPriceIncrease: number,
    purchasedEffectiveVol: number
  ): Map<number, number> {
    const correlatedIncreases = new Map<number, number>();
    for (const beer of sameSectorBeers) {
      const beerEffectiveVol = this.calculateEffectiveVolatility(beer);
      const relativeVolatility = beerEffectiveVol / purchasedEffectiveVol;
      const correlatedIncrease = rawPriceIncrease * this.settings.sectorCorrelation * relativeVolatility;
      correlatedIncreases.set(beer.id, correlatedIncrease);
    }
    return correlatedIncreases;
  }

  private calculateDecreaseWeights(
    otherSectorBeers: Beer[],
    purchasedBeer: Beer
  ): { weights: Map<number, number>; totalWeight: number } {
    const weights = new Map<number, number>();
    let totalWeight = 0;

    for (const beer of otherSectorBeers) {
      const matrixWeight = SECTOR_MATRIX[purchasedBeer.category]?.[beer.category] ?? 0.5;
      const volatilityWeight = this.calculateEffectiveVolatility(beer);
      const combinedWeight = matrixWeight * volatilityWeight;
      weights.set(beer.id, combinedWeight);
      totalWeight += combinedWeight;
    }

    return { weights, totalWeight };
  }

  private applyPurchasedBeerIncrease(ctx: PriceContext, beer: Beer, rawPriceIncrease: number): void {
    const meanReversion = this.calculateMeanReversion(beer);
    let newPrice = this.roundToQuarter(beer.currentPrice + rawPriceIncrease + meanReversion);
    newPrice = this.clampPrice(newPrice);
    const change = newPrice - beer.currentPrice;

    ctx.totalActualIncrease += change;
    ctx.updates.push({ id: beer.id, price: newPrice });
    ctx.beerChanges[beer.category][beer.name] = change;
    ctx.sectorChanges[beer.category] += change;
  }

  private applySameSectorIncreases(
    ctx: PriceContext,
    sameSectorBeers: Beer[],
    correlatedIncreases: Map<number, number>
  ): void {
    for (const beer of sameSectorBeers) {
      const rawCorrelatedIncrease = correlatedIncreases.get(beer.id) || 0;
      const meanReversion = this.calculateMeanReversion(beer);
      let newPrice = this.roundToQuarter(beer.currentPrice + rawCorrelatedIncrease + meanReversion);
      newPrice = this.clampPrice(newPrice);
      const change = newPrice - beer.currentPrice;

      ctx.totalActualIncrease += change;
      ctx.updates.push({ id: beer.id, price: newPrice });
      ctx.beerChanges[beer.category][beer.name] = change;
      ctx.sectorChanges[beer.category] += change;
    }
  }

  private calculateDecreases(
    otherSectorBeers: Beer[],
    decreaseWeights: Map<number, number>,
    totalWeight: number,
    totalActualIncrease: number
  ): BeerResult[] {
    const results: BeerResult[] = [];

    // Sort by weight (highest first) - higher weighted beers absorb more
    const sortedBeers = [...otherSectorBeers].sort((a, b) => {
      return (decreaseWeights.get(b.id) || 0) - (decreaseWeights.get(a.id) || 0);
    });

    for (const beer of sortedBeers) {
      const weight = decreaseWeights.get(beer.id) || 0;
      const share = totalWeight > 0 ? weight / totalWeight : 0;

      // Calculate target decrease with protections
      let targetDecrease = totalActualIncrease * share;
      targetDecrease = Math.min(targetDecrease, beer.currentPrice * MAX_DECREASE_RATIO); // Max 10%

      // Brake near floor
      const distanceToFloor = (beer.currentPrice - this.settings.minPrice) / beer.currentPrice;
      targetDecrease *= Math.min(1.0, distanceToFloor * 2);

      // Apply mean reversion and calculate new price
      const meanReversion = this.calculateMeanReversion(beer);
      let newPrice = this.roundToQuarter(beer.currentPrice - targetDecrease + meanReversion);
      newPrice = Math.max(newPrice, this.settings.minPrice);
      newPrice = this.clampPrice(newPrice);

      results.push({ beer, newPrice, change: newPrice - beer.currentPrice });
    }

    return results;
  }

  private balanceZeroSum(results: BeerResult[], totalActualIncrease: number): void {
    const totalDecrease = results.reduce((sum, r) => sum + Math.abs(r.change), 0);
    let imbalance = totalActualIncrease - totalDecrease;

    // Distribute 0.25€ adjustments until balanced
    while (Math.abs(imbalance) >= 0.20) {
      let adjusted = false;

      for (const result of results) {
        if (Math.abs(imbalance) < 0.20) break;

        const adjustment = imbalance > 0 ? -0.25 : 0.25;
        const newPrice = result.newPrice + adjustment;

        if (newPrice >= this.settings.minPrice && newPrice <= this.settings.maxPrice) {
          result.newPrice = newPrice;
          result.change = newPrice - result.beer.currentPrice;
          imbalance += adjustment;
          adjusted = true;
        }
      }

      if (!adjusted) break;
    }
  }

  private finalizeOtherBeerUpdates(ctx: PriceContext, results: BeerResult[]): void {
    for (const result of results) {
      ctx.updates.push({ id: result.beer.id, price: result.newPrice });
      ctx.beerChanges[result.beer.category][result.beer.name] = result.change;
      ctx.sectorChanges[result.beer.category] += result.change;
    }
  }

  /**
   * Calculate effective volatility based on price ratio
   * Expensive beers become more stable (lower volatility)
   */
  private calculateEffectiveVolatility(beer: Beer): number {
    const priceRatio = Math.max(0.5, Math.min(2.0, beer.currentPrice / beer.basePrice));
    const modifier = Math.max(0.5, Math.min(1.2, 1 - 0.3 * Math.log(priceRatio)));
    return beer.volatility * modifier;
  }

  /**
   * Calculate mean reversion correction
   * Pulls prices back toward base price
   */
  private calculateMeanReversion(beer: Beer): number {
    const gapRatio = Math.abs(beer.currentPrice - beer.basePrice) / beer.basePrice;
    const proportionalStrength = MEAN_REVERSION_BASE_STRENGTH * (1 + gapRatio);
    const sectorMultiplier = SECTOR_REVERSION_MULTIPLIERS[beer.category] ?? 1.0;

    return (beer.basePrice - beer.currentPrice) * proportionalStrength * sectorMultiplier;
  }

  /**
   * Round price to nearest 0.25€
   */
  private roundToQuarter(price: number): number {
    return Math.round(price * 4) / 4;
  }

  /**
   * Clamp price between min and max
   */
  private clampPrice(price: number): number {
    return Math.max(
      this.settings.minPrice,
      Math.min(this.settings.maxPrice, price)
    );
  }
}
