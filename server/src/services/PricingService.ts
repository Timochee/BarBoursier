import type { Beer, Settings, PurchaseImpact } from 'shared';
import {
  SECTOR_MATRIX,
  SECTOR_REVERSION_MULTIPLIERS,
  MEAN_REVERSION_BASE_STRENGTH,
  MAX_DECREASE_RATIO,
} from 'shared';

// Prices move in 0.25 steps, so a residual below this is considered balanced
const PRICE_STEP = 0.25;
const ZERO_SUM_TOLERANCE = 0.2;

// Internal types for price calculation
interface BeerResult {
  beer: Beer;
  newPrice: number;
  change: number;
}

export class PricingService {
  constructor(private settings: Settings) {}

  /**
   * Calculate all price changes after a beer purchase
   * Ensures zero-sum market: increases are offset by other sectors,
   * and scaled down when those sectors cannot absorb them
   */
  calculatePriceChanges(
    beers: Beer[],
    purchasedBeer: Beer,
    quantity: number
  ): { updates: { id: number; price: number }[]; impact: PurchaseImpact } {
    // Using quantity^0.7 for stronger impact than sqrt but not linear
    // sqrt: qty 4 = 2x, qty 9 = 3x | pow 0.7: qty 4 = 2.6x, qty 9 = 4.7x
    const purchasedEffectiveVol = this.calculateEffectiveVolatility(purchasedBeer);
    const quantityMultiplier = Math.pow(quantity, 0.7);
    const rawPriceIncrease = this.settings.baseMove * purchasedEffectiveVol * purchasedBeer.currentPrice * quantityMultiplier;

    const sameSectorBeers = beers.filter(b => b.category === purchasedBeer.category && b.id !== purchasedBeer.id);
    const correlatedIncreases = this.calculateCorrelatedIncreases(sameSectorBeers, rawPriceIncrease, purchasedEffectiveVol);

    const otherSectorBeers = beers.filter(b => b.category !== purchasedBeer.category);
    const { weights: decreaseWeights, totalWeight } = this.calculateDecreaseWeights(otherSectorBeers, purchasedBeer);

    // Increases: purchased beer first, then same sector
    const increaseResults = [
      this.calculateIncrease(purchasedBeer, rawPriceIncrease),
      ...sameSectorBeers.map(b => this.calculateIncrease(b, correlatedIncreases.get(b.id) ?? 0)),
    ];
    const totalIncrease = this.sumChanges(increaseResults);

    // Decreases for other sectors, balanced against the increases
    const decreaseResults = this.calculateDecreases(otherSectorBeers, decreaseWeights, totalWeight, totalIncrease);
    const excess = this.balanceZeroSum(decreaseResults, totalIncrease);
    this.scaleDownIncreases(increaseResults, excess);

    const results = [...increaseResults, ...decreaseResults];
    return {
      updates: results.map(r => ({ id: r.beer.id, price: r.newPrice })),
      impact: {
        purchasedBeerName: purchasedBeer.name,
        quantity,
        ...this.summarizeChanges(beers, results),
      },
    };
  }

  // --- Private helper methods (extracted for KISS) ---

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

  private calculateIncrease(beer: Beer, rawIncrease: number): BeerResult {
    const meanReversion = this.calculateMeanReversion(beer);
    const newPrice = this.clampPrice(this.roundToQuarter(beer.currentPrice + rawIncrease + meanReversion));
    return { beer, newPrice, change: newPrice - beer.currentPrice };
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

  /**
   * Adjust other-sector prices in 0.25 steps until they offset the increase.
   * Returns the increase they could not absorb (positive = market still up).
   */
  private balanceZeroSum(results: BeerResult[], totalActualIncrease: number): number {
    let imbalance = totalActualIncrease + this.sumChanges(results);

    while (Math.abs(imbalance) >= ZERO_SUM_TOLERANCE) {
      let adjusted = false;

      for (const result of results) {
        if (Math.abs(imbalance) < ZERO_SUM_TOLERANCE) break;

        const adjustment = imbalance > 0 ? -PRICE_STEP : PRICE_STEP;
        const newPrice = result.newPrice + adjustment;

        if (newPrice >= this.settings.minPrice && newPrice <= this.settings.maxPrice) {
          this.setPrice(result, newPrice);
          imbalance += adjustment;
          adjusted = true;
        }
      }

      if (!adjusted) break;
    }

    return imbalance;
  }

  /**
   * Remove the unabsorbed excess from the increases in 0.25 steps,
   * same-sector beers first, never below their previous price
   */
  private scaleDownIncreases(results: BeerResult[], excess: number): void {
    let remaining = excess;
    const byPriority = [...results].reverse();

    while (remaining >= ZERO_SUM_TOLERANCE) {
      let adjusted = false;

      for (const result of byPriority) {
        if (remaining < ZERO_SUM_TOLERANCE) break;

        const newPrice = result.newPrice - PRICE_STEP;
        if (newPrice >= result.beer.currentPrice && newPrice >= this.settings.minPrice) {
          this.setPrice(result, newPrice);
          remaining -= PRICE_STEP;
          adjusted = true;
        }
      }

      if (!adjusted) break;
    }
  }

  private summarizeChanges(
    beers: Beer[],
    results: BeerResult[]
  ): Pick<PurchaseImpact, 'sectorChanges' | 'beerChanges'> {
    const sectorChanges: Record<string, number> = {};
    const beerChanges: Record<string, Record<string, number>> = {};
    for (const sector of new Set(beers.map(b => b.category))) {
      sectorChanges[sector] = 0;
      beerChanges[sector] = {};
    }

    for (const { beer, change } of results) {
      sectorChanges[beer.category] += change;
      beerChanges[beer.category][beer.name] = change;
    }

    return { sectorChanges, beerChanges };
  }

  private setPrice(result: BeerResult, newPrice: number): void {
    result.newPrice = newPrice;
    result.change = newPrice - result.beer.currentPrice;
  }

  private sumChanges(results: BeerResult[]): number {
    return results.reduce((sum, r) => sum + r.change, 0);
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
