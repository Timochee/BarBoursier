import { useState, useRef, useMemo } from 'react';
import type { Beer } from '../types';
import { createBeerColorMap, getBeerColor } from '../utils/colors';

interface BeerTableProps {
  beers: Beer[];
  onBuy: (beerId: number, quantity: number) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  pils: 'badge-pils',
  abbey: 'badge-abbey',
  trappist: 'badge-trappist',
  specialty: 'badge-specialty',
};

const BUY_COOLDOWN_MS = 300;

type SortField = 'category' | 'name' | 'basePrice' | 'currentPrice' | 'change';
type SortDirection = 'asc' | 'desc';

const CATEGORY_ORDER: Record<string, number> = {
  pils: 0,
  abbey: 1,
  trappist: 2,
  specialty: 3,
};

export function BeerTable({ beers, onBuy }: BeerTableProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [processingBeer, setProcessingBeer] = useState<number | null>(null);
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const lastBuyTime = useRef<number>(0);

  // Create stable color map based on beer IDs
  const beerColorMap = useMemo(() => createBeerColorMap(beers), [beers]);

  const handleQuantityChange = (beerId: number, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 1) {
      setQuantities(prev => ({ ...prev, [beerId]: qty }));
    }
  };

  const handleBuy = (beerId: number) => {
    const now = Date.now();
    if (now - lastBuyTime.current < BUY_COOLDOWN_MS) return;
    if (processingBeer !== null) return;

    lastBuyTime.current = now;
    setProcessingBeer(beerId);

    const quantity = quantities[beerId] || 1;
    onBuy(beerId, quantity);
    setQuantities(prev => ({ ...prev, [beerId]: 1 }));

    setTimeout(() => {
      setProcessingBeer(null);
    }, BUY_COOLDOWN_MS);
  };

  const getChangePercent = (beer: Beer) => {
    return ((beer.currentPrice - beer.basePrice) / beer.basePrice) * 100;
  };

  const getChangeClass = (change: number) => {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-neutral';
  };

  const getPriceArrow = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (change < 0) {
      return (
        <svg className="w-4 h-4 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Sort beers
  const sortedBeers = useMemo(() => {
    return [...beers].sort((a, b) => {
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
  }, [beers, sortField, sortDirection]);

  // Group beers by category for showing category badges
  const categoryFirstBeer = useMemo(() => {
    const firstBeers = new Set<number>();
    const seenCategories = new Set<string>();

    for (const beer of sortedBeers) {
      if (!seenCategories.has(beer.category)) {
        seenCategories.add(beer.category);
        firstBeers.add(beer.id);
      }
    }

    return firstBeers;
  }, [sortedBeers]);

  const SortableHeader = ({ field, children, align = 'left' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <th
      className={`p-4 text-${align} text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors select-none`}
      style={{ color: 'var(--text-secondary)' }}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {getSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            <SortableHeader field="category">Category</SortableHeader>
            <SortableHeader field="name">Beer</SortableHeader>
            <SortableHeader field="basePrice" align="right">Base</SortableHeader>
            <SortableHeader field="currentPrice" align="right">Current</SortableHeader>
            <SortableHeader field="change" align="right">Change</SortableHeader>
            <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Quantity
            </th>
            <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedBeers.map((beer) => {
            const change = getChangePercent(beer);
            const isFirstInCategory = categoryFirstBeer.has(beer.id);
            const isProcessing = processingBeer === beer.id;
            const isDisabled = processingBeer !== null;
            const beerColor = getBeerColor(beer.id, beerColorMap);

            return (
              <tr key={beer.id} className="table-row group">
                <td className="p-4">
                  {isFirstInCategory && (
                    <span className={`badge ${CATEGORY_STYLES[beer.category]}`}>
                      {beer.category}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: beerColor }}
                    >
                      {beer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{beer.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Vol: {(beer.volatility * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {beer.basePrice.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <span className="text-lg font-bold tabular-nums">
                    {beer.currentPrice.toFixed(2)}
                  </span>
                  <span className="text-xs ml-1" style={{ color: 'var(--text-secondary)' }}>EUR</span>
                </td>
                <td className={`p-4 text-right tabular-nums ${getChangeClass(change)}`}>
                  <span className="inline-flex items-center">
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    {getPriceArrow(change)}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <input
                    type="number"
                    min="1"
                    value={quantities[beer.id] || 1}
                    onChange={e => handleQuantityChange(beer.id, e.target.value)}
                    className="w-16 p-2 text-center text-sm"
                    disabled={isDisabled}
                  />
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleBuy(beer.id)}
                    disabled={isDisabled}
                    className={`btn btn-primary text-sm min-w-[60px] ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Buy'
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
