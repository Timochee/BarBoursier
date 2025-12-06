"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const shared_1 = require("shared");
class PricingService {
    constructor(settings) {
        this.settings = settings;
    }
    /**
     * Calculate all price changes after a beer purchase
     * Ensures zero-sum market by using a two-pass approach:
     * 1. First pass: calculate all decreases with rounding
     * 2. Adjust one beer to compensate for any rounding difference
     */
    calculatePriceChanges(beers, purchasedBeer, quantity) {
        const updates = [];
        const sectorChanges = {};
        const beerChanges = {};
        // Initialize sector changes
        const sectors = [...new Set(beers.map(b => b.category))];
        sectors.forEach(s => { sectorChanges[s] = 0; beerChanges[s] = {}; });
        // 1. Calculate base increase for purchased beer
        const purchasedEffectiveVol = this.calculateEffectiveVolatility(purchasedBeer);
        const rawPriceIncrease = this.settings.baseMove * purchasedEffectiveVol * purchasedBeer.currentPrice * Math.sqrt(quantity);
        // 2. Calculate correlated increases for same-sector beers
        const sameSectorBeers = beers.filter(b => b.category === purchasedBeer.category && b.id !== purchasedBeer.id);
        const rawCorrelatedIncreases = new Map();
        for (const beer of sameSectorBeers) {
            const beerEffectiveVol = this.calculateEffectiveVolatility(beer);
            const relativeVolatility = beerEffectiveVol / purchasedEffectiveVol;
            const correlatedIncrease = rawPriceIncrease * this.settings.sectorCorrelation * relativeVolatility;
            rawCorrelatedIncreases.set(beer.id, correlatedIncrease);
        }
        // 3. Calculate decrease weights for other sector beers
        const otherSectorBeers = beers.filter(b => b.category !== purchasedBeer.category);
        const decreaseWeights = new Map();
        let totalWeight = 0;
        for (const beer of otherSectorBeers) {
            const matrixWeight = shared_1.SECTOR_MATRIX[purchasedBeer.category]?.[beer.category] ?? 0.5;
            const volatilityWeight = this.calculateEffectiveVolatility(beer);
            const combinedWeight = matrixWeight * volatilityWeight;
            decreaseWeights.set(beer.id, combinedWeight);
            totalWeight += combinedWeight;
        }
        // 4. Apply increases first and track actual changes after rounding
        let totalActualIncrease = 0;
        // Purchased beer: increase + mean reversion
        const purchasedMeanReversion = this.calculateMeanReversion(purchasedBeer);
        let newPurchasedPrice = this.roundToQuarter(purchasedBeer.currentPrice + rawPriceIncrease + purchasedMeanReversion);
        newPurchasedPrice = this.clampPrice(newPurchasedPrice);
        const purchasedChange = newPurchasedPrice - purchasedBeer.currentPrice;
        totalActualIncrease += purchasedChange;
        updates.push({ id: purchasedBeer.id, price: newPurchasedPrice });
        beerChanges[purchasedBeer.category][purchasedBeer.name] = purchasedChange;
        sectorChanges[purchasedBeer.category] += purchasedChange;
        // Same sector beers: correlated increase + mean reversion
        for (const beer of sameSectorBeers) {
            const rawCorrelatedIncrease = rawCorrelatedIncreases.get(beer.id) || 0;
            const meanReversion = this.calculateMeanReversion(beer);
            let newPrice = this.roundToQuarter(beer.currentPrice + rawCorrelatedIncrease + meanReversion);
            newPrice = this.clampPrice(newPrice);
            const change = newPrice - beer.currentPrice;
            totalActualIncrease += change;
            updates.push({ id: beer.id, price: newPrice });
            beerChanges[beer.category][beer.name] = change;
            sectorChanges[beer.category] += change;
        }
        // 5. First pass: calculate all decreases with rounding
        // Store preliminary results for other sector beers
        const otherBeerResults = [];
        // Sort beers by weight (highest first) - higher weighted beers absorb more
        const sortedOtherBeers = [...otherSectorBeers].sort((a, b) => {
            const weightA = decreaseWeights.get(a.id) || 0;
            const weightB = decreaseWeights.get(b.id) || 0;
            return weightB - weightA;
        });
        for (const beer of sortedOtherBeers) {
            const weight = decreaseWeights.get(beer.id) || 0;
            const share = totalWeight > 0 ? weight / totalWeight : 0;
            // Calculate target decrease for this beer
            let targetDecrease = totalActualIncrease * share;
            // Protection 1: Max 10% decrease per transaction
            targetDecrease = Math.min(targetDecrease, beer.currentPrice * shared_1.MAX_DECREASE_RATIO);
            // Protection 2: Brake near floor
            const distanceToFloor = (beer.currentPrice - this.settings.minPrice) / beer.currentPrice;
            const protectionFactor = Math.min(1.0, distanceToFloor * 2);
            targetDecrease *= protectionFactor;
            // Apply mean reversion
            const meanReversion = this.calculateMeanReversion(beer);
            // Calculate new price with decrease + mean reversion
            let newPrice = beer.currentPrice - targetDecrease + meanReversion;
            // Round to quarter
            newPrice = this.roundToQuarter(newPrice);
            // Protection 3: Absolute floor
            newPrice = Math.max(newPrice, this.settings.minPrice);
            newPrice = this.clampPrice(newPrice);
            const change = newPrice - beer.currentPrice;
            otherBeerResults.push({ beer, newPrice, change });
        }
        // 6. Calculate total decrease and find the imbalance
        let totalActualDecrease = otherBeerResults.reduce((sum, r) => sum + Math.abs(r.change), 0);
        let imbalance = totalActualIncrease - totalActualDecrease;
        // 7. Second pass: adjust prices to achieve zero-sum
        // Distribute 0.25€ adjustments across beers until balanced
        while (Math.abs(imbalance) >= 0.20) {
            let adjusted = false;
            for (const result of otherBeerResults) {
                if (Math.abs(imbalance) < 0.20)
                    break;
                // If imbalance > 0, we need more decrease (lower price by 0.25)
                // If imbalance < 0, we need less decrease (raise price by 0.25)
                const adjustmentNeeded = imbalance > 0 ? -0.25 : 0.25;
                const newAdjustedPrice = result.newPrice + adjustmentNeeded;
                // Check if adjustment is valid (within bounds)
                if (newAdjustedPrice >= this.settings.minPrice && newAdjustedPrice <= this.settings.maxPrice) {
                    result.newPrice = newAdjustedPrice;
                    result.change = result.newPrice - result.beer.currentPrice;
                    imbalance += adjustmentNeeded; // Negative adjustment reduces positive imbalance
                    adjusted = true;
                }
            }
            // If no beer could be adjusted, break to avoid infinite loop
            if (!adjusted)
                break;
        }
        // 8. Push all other beer updates
        for (const result of otherBeerResults) {
            updates.push({ id: result.beer.id, price: result.newPrice });
            beerChanges[result.beer.category][result.beer.name] = result.change;
            sectorChanges[result.beer.category] += result.change;
        }
        return {
            updates,
            impact: {
                purchasedBeerName: purchasedBeer.name,
                quantity,
                sectorChanges,
                beerChanges,
            },
        };
    }
    /**
     * Calculate effective volatility based on price ratio
     * Expensive beers become more stable (lower volatility)
     */
    calculateEffectiveVolatility(beer) {
        const priceRatio = Math.max(0.5, Math.min(2.0, beer.currentPrice / beer.basePrice));
        const modifier = Math.max(0.5, Math.min(1.2, 1 - 0.3 * Math.log(priceRatio)));
        return beer.volatility * modifier;
    }
    /**
     * Calculate mean reversion correction
     * Pulls prices back toward base price
     */
    calculateMeanReversion(beer) {
        const gapRatio = Math.abs(beer.currentPrice - beer.basePrice) / beer.basePrice;
        const proportionalStrength = shared_1.MEAN_REVERSION_BASE_STRENGTH * (1 + gapRatio);
        const sectorMultiplier = shared_1.SECTOR_REVERSION_MULTIPLIERS[beer.category] ?? 1.0;
        return (beer.basePrice - beer.currentPrice) * proportionalStrength * sectorMultiplier;
    }
    /**
     * Round price to nearest 0.25€
     */
    roundToQuarter(price) {
        return Math.round(price * 4) / 4;
    }
    /**
     * Clamp price between min and max
     */
    clampPrice(price) {
        return Math.max(this.settings.minPrice, Math.min(this.settings.maxPrice, price));
    }
}
exports.PricingService = PricingService;
