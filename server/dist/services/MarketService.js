"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketService = exports.MarketService = void 0;
const repositories_1 = require("../repositories");
const PricingService_1 = require("./PricingService");
const helpers_1 = require("../utils/helpers");
class MarketService {
    constructor() {
        this.pricingService = null;
    }
    getPricingService() {
        if (!this.pricingService) {
            const settings = repositories_1.settingsRepository.getAll();
            this.pricingService = new PricingService_1.PricingService(settings);
        }
        return this.pricingService;
    }
    buy(beerId, quantity) {
        const beer = repositories_1.beerRepository.getById(beerId);
        if (!beer) {
            return null;
        }
        const beers = repositories_1.beerRepository.getAll();
        const { updates, impact } = this.getPricingService().calculatePriceChanges(beers, beer, quantity);
        // Update prices in database
        repositories_1.beerRepository.updatePrices(updates);
        // Record transaction
        repositories_1.transactionRepository.create(beerId, quantity, beer.currentPrice);
        // Record price history
        const priceRecords = updates.map(u => ({ beerId: u.id, price: u.price }));
        repositories_1.priceHistoryRepository.recordPrices(priceRecords);
        // Get updated beer
        const updatedBeer = repositories_1.beerRepository.getById(beerId);
        return {
            beer: updatedBeer,
            impact,
        };
    }
    reset() {
        // Reset all beer prices to base prices
        repositories_1.beerRepository.resetPrices();
        // Clear transaction history
        repositories_1.transactionRepository.deleteAll();
        // Clear price history
        repositories_1.priceHistoryRepository.deleteAll();
        // Record initial prices
        const beers = repositories_1.beerRepository.getAll();
        repositories_1.priceHistoryRepository.recordPrices((0, helpers_1.beersToRecords)(beers));
        return beers;
    }
    getStats() {
        return {
            totalMarketPrice: repositories_1.beerRepository.getTotalMarketPrice(),
            transactionCount: repositories_1.transactionRepository.getCount(),
        };
    }
    getAllBeers() {
        return repositories_1.beerRepository.getAll();
    }
}
exports.MarketService = MarketService;
exports.marketService = new MarketService();
