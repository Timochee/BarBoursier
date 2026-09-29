import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../test/db';
import { beerRepository } from '../repositories';
import { marketService } from './MarketService';

describe('MarketService.buy', () => {
  let beerId: number;

  beforeEach(() => {
    resetDatabase();
    beerId = beerRepository.create({ name: 'Jupiler', basePrice: 2, category: 'pils', volatility: 0.2 }).id;
    beerRepository.create({ name: 'Leffe', basePrice: 4, category: 'abbey', volatility: 0.35 });
  });

  const currentPrices = () => beerRepository.getAll().map((b) => b.currentPrice);

  it.each([-1, 0, 1.5, Number.NaN, 101])('rejects quantity %s without touching prices', (quantity) => {
    const before = currentPrices();

    const outcome = marketService.buy(beerId, quantity);

    expect(outcome).toEqual({ ok: false, error: 'invalid_quantity' });
    expect(currentPrices()).toEqual(before);
  });

  it('rejects an unknown beer', () => {
    expect(marketService.buy(9999, 1)).toEqual({ ok: false, error: 'beer_not_found' });
  });

  it('raises the purchased beer price for a valid quantity', () => {
    const outcome = marketService.buy(beerId, 2);

    expect(outcome.ok).toBe(true);
    expect(beerRepository.getById(beerId)?.currentPrice).toBeGreaterThan(2);
    expect(currentPrices().every(Number.isFinite)).toBe(true);
  });
});
