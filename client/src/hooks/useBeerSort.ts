import { useState, useMemo } from 'react';
import type { Beer } from 'shared';
import { getChangePercent } from '../utils/priceChange';

export type SortField = 'category' | 'name' | 'basePrice' | 'currentPrice' | 'change';
export type SortDirection = 'asc' | 'desc';

const CATEGORY_ORDER: Record<string, number> = {
  pils: 0,
  abbey: 1,
  trappist: 2,
  specialty: 3,
};

export function useBeerSort(beers: Beer[], categoryFilter: string | null, searchQuery: string = '') {
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBeers = useMemo(() => {
    let filtered = beers;

    // Apply search filter (searches name and category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(beer =>
        beer.name.toLowerCase().includes(query) ||
        beer.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(beer => beer.category === categoryFilter);
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'category':
          comparison = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
          if (comparison === 0) comparison = a.name.localeCompare(b.name);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'basePrice':
          comparison = a.basePrice - b.basePrice;
          break;
        case 'currentPrice':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'change':
          comparison = getChangePercent(a) - getChangePercent(b);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [beers, sortField, sortDirection, categoryFilter, searchQuery]);

  // Show category badge only for first beer in each consecutive category group
  const showBadgeForBeer = useMemo(() => {
    const result = new Set<number>();
    let lastCategory: string | null = null;

    for (const beer of sortedBeers) {
      if (beer.category !== lastCategory) {
        result.add(beer.id);
        lastCategory = beer.category;
      }
    }

    return result;
  }, [sortedBeers]);

  return {
    sortField,
    sortDirection,
    sortedBeers,
    showBadgeForBeer,
    handleSort,
    getChangePercent,
  };
}
