"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECTOR_MATRIX = exports.SECTOR_REVERSION_MULTIPLIERS = exports.MAX_DECREASE_RATIO = exports.MEAN_REVERSION_BASE_STRENGTH = exports.DEFAULT_SETTINGS = void 0;
exports.DEFAULT_SETTINGS = {
    baseMove: 0.45,
    sectorCorrelation: 0.45,
    minPrice: 0.50,
    maxPrice: 25.00,
};
// Pricing algorithm constants
exports.MEAN_REVERSION_BASE_STRENGTH = 0.01;
exports.MAX_DECREASE_RATIO = 0.10; // 10% max decrease per transaction
// Sector reversion multipliers - how fast each sector returns to base price
// Higher = faster return to base
exports.SECTOR_REVERSION_MULTIPLIERS = {
    pils: 1.5, // Fast return - stable beers
    abbey: 1.0, // Normal return
    specialty: 0.8, // Slow return
    trappist: 0.6, // Slowest return - stays "deregulated" longer
};
// Sector correlation matrix for price decreases
// Reading: buying [row] causes [column] to decrease by this weight
exports.SECTOR_MATRIX = {
    pils: { abbey: 0.8, trappist: 0.5, specialty: 0.3 },
    abbey: { pils: 0.6, trappist: 0.9, specialty: 0.4 },
    trappist: { pils: 0.5, abbey: 0.9, specialty: 0.5 },
    specialty: { pils: 0.4, abbey: 0.5, trappist: 0.5 },
};
