import { describe, expect, it } from 'vitest';
import type { Beer } from 'shared';
import { DEFAULT_SETTINGS } from 'shared';
import { PricingService } from './PricingService';

// Rounding to 0.25 steps leaves at most this residual per transaction
const ZERO_SUM_TOLERANCE = 0.2;

const MARKET: Beer[] = [
  { id: 1, name: 'Jupiler', category: 'pils', basePrice: 2.5, currentPrice: 2.5, volatility: 0.22 },
  { id: 2, name: 'Stella', category: 'pils', basePrice: 2.5, currentPrice: 2.5, volatility: 0.25 },
  { id: 3, name: 'Leffe', category: 'abbey', basePrice: 4, currentPrice: 4, volatility: 0.35 },
  { id: 4, name: 'Grimbergen', category: 'abbey', basePrice: 4, currentPrice: 4, volatility: 0.32 },
  { id: 5, name: 'Chimay', category: 'trappist', basePrice: 5, currentPrice: 5, volatility: 0.5 },
  { id: 6, name: 'Orval', category: 'trappist', basePrice: 5.5, currentPrice: 5.5, volatility: 0.45 },
  { id: 7, name: 'Duvel', category: 'specialty', basePrice: 4.5, currentPrice: 4.5, volatility: 0.45 },
  { id: 8, name: 'Kwak', category: 'specialty', basePrice: 5, currentPrice: 5, volatility: 0.4 },
];

const pricing = new PricingService(DEFAULT_SETTINGS);

function totalPrice(beers: Beer[]): number {
  return beers.reduce((sum, b) => sum + b.currentPrice, 0);
}

function applyUpdates(beers: Beer[], updates: { id: number; price: number }[]): Beer[] {
  const prices = new Map(updates.map((u) => [u.id, u.price]));
  return beers.map((b) => ({ ...b, currentPrice: prices.get(b.id) ?? b.currentPrice }));
}

function buy(beers: Beer[], beerId: number, quantity: number): Beer[] {
  const purchased = beers.find((b) => b.id === beerId)!;
  return applyUpdates(beers, pricing.calculatePriceChanges(beers, purchased, quantity).updates);
}

// Deterministic PRNG (mulberry32) so the simulation is reproducible
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('PricingService', () => {
  it('raises the purchased beer and lowers other sectors', () => {
    const after = buy(MARKET, 1, 1);

    expect(after[0].currentPrice).toBeGreaterThan(MARKET[0].currentPrice);
    expect(after.filter((b) => b.category !== 'pils').some((b) => b.currentPrice < 4)).toBe(true);
  });

  it('keeps the market zero-sum on a single purchase', () => {
    const after = buy(MARKET, 5, 3);

    expect(Math.abs(totalPrice(after) - totalPrice(MARKET))).toBeLessThan(ZERO_SUM_TOLERANCE);
  });

  it('keeps the market zero-sum when another sector reverts upward to its base price', () => {
    const market = MARKET.map((b) => (b.id === 3 ? { ...b, basePrice: 20, currentPrice: 0.75 } : b));

    const after = buy(market, 1, 1);

    expect(Math.abs(totalPrice(after) - totalPrice(market))).toBeLessThan(ZERO_SUM_TOLERANCE);
  });

  it('scales increases down when other sectors are already at the floor', () => {
    const market = MARKET.map((b) =>
      b.category === 'trappist' ? b : { ...b, currentPrice: DEFAULT_SETTINGS.minPrice }
    );

    const after = buy(market, 6, 4);

    expect(Math.abs(totalPrice(after) - totalPrice(market))).toBeLessThan(ZERO_SUM_TOLERANCE);
  });

  it('keeps the market zero-sum and within bounds over a long purchase sequence', () => {
    const random = seededRandom(42);
    let beers = MARKET;

    for (let i = 0; i < 200; i++) {
      const before = totalPrice(beers);
      const target = beers[Math.floor(random() * beers.length)];
      beers = buy(beers, target.id, 1 + Math.floor(random() * 5));

      expect(Math.abs(totalPrice(beers) - before)).toBeLessThan(ZERO_SUM_TOLERANCE);
      for (const beer of beers) {
        expect(beer.currentPrice).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.minPrice);
        expect(beer.currentPrice).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxPrice);
      }
    }
  });

  it('dampens bulk purchases (quantity 4 moves less than 4 single purchases)', () => {
    const bulk = buy(MARKET, 1, 4)[0].currentPrice - MARKET[0].currentPrice;
    const single = buy(MARKET, 1, 1)[0].currentPrice - MARKET[0].currentPrice;

    expect(bulk).toBeLessThan(single * 4);
  });
});
