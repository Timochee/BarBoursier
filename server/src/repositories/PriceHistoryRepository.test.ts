import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../test/db';
import { beerRepository } from './BeerRepository';
import { priceHistoryRepository } from './PriceHistoryRepository';

describe('PriceHistoryRepository', () => {
  let beerId: number;

  beforeEach(() => {
    resetDatabase();
    beerId = beerRepository.create({ name: 'Jupiler', basePrice: 2, category: 'pils', volatility: 0.2 }).id;
  });

  function recordBatches(count: number): void {
    for (let price = 0; price < count; price++) {
      priceHistoryRepository.recordPrices([{ beerId, price }]);
    }
  }

  it('returns the most recent batches when history exceeds the limit', () => {
    recordBatches(105);

    const prices = priceHistoryRepository.getAllHistory(100).get(beerId);

    expect(prices).toHaveLength(100);
    expect(prices?.[0]).toBe(5);
    expect(prices?.at(-1)).toBe(104);
  });

  it('returns one time label per returned batch', () => {
    recordBatches(105);

    expect(priceHistoryRepository.getTimeLabels(100)).toHaveLength(100);
  });

  it('returns the whole history in chronological order when under the limit', () => {
    recordBatches(3);

    expect(priceHistoryRepository.getAllHistory(100).get(beerId)).toEqual([0, 1, 2]);
  });
});
