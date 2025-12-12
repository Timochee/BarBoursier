import { useMemo } from 'react';
import type { Beer } from 'shared';
import { createBeerColorMap, getBeerColor } from '../utils/colors';
import { CATEGORY_STYLES, getCategoryBadgeStyle } from '../utils/styles';
import { getChangeClass, PriceArrow } from '../utils/priceChange';
import { useBeerSort, useBuyQuantity, type SortField } from '../hooks';
import type { FilterState } from './AdvancedFilters';
import { SortIcon, ChevronUpIcon, ChevronDownIcon, SpinnerIcon } from './Icons';

interface BeerTableProps {
  beers: Beer[];
  onBuy: (beerId: number, quantity: number) => void;
  keepQuantity?: boolean;
  categoryFilter: string | null;
  searchQuery?: string;
  isAdmin?: boolean;
  advancedFilters?: FilterState;
}

export function BeerTable({ beers, onBuy, keepQuantity = false, categoryFilter, searchQuery = '', isAdmin = false, advancedFilters }: BeerTableProps) {
  const {
    sortField,
    sortDirection,
    sortedBeers,
    showBadgeForBeer,
    handleSort,
    getChangePercent,
  } = useBeerSort(beers, categoryFilter, searchQuery, advancedFilters);

  const {
    getQuantity,
    setQuantity,
    handleBlur,
    handleBuy,
    isProcessing,
    isDisabled,
  } = useBuyQuantity({ onBuy, keepQuantity });

  // Create stable color map based on beer IDs
  const beerColorMap = useMemo(() => createBeerColorMap(beers), [beers]);

  // Get all unique categories for consistent color generation
  const allCategories = useMemo(() => [...new Set(beers.map(b => b.category))], [beers]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <SortIcon className="w-4 h-4 opacity-30" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUpIcon />;
    }
    return <ChevronDownIcon />;
  };

  const SortableHeader = ({ field, children, align = 'left', className = '' }: { field: SortField; children: React.ReactNode; align?: 'left' | 'right'; className?: string }) => (
    <th
      className={`p-4 text-${align} text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors select-none ${className}`}
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
      <table className="w-full" role="grid" aria-label="Beer market prices">
        <thead>
          <tr className="table-header">
            <SortableHeader field="category" className="hidden sm:table-cell">Cat.</SortableHeader>
            <SortableHeader field="name">Beer</SortableHeader>
            <SortableHeader field="basePrice" align="right" className="hidden sm:table-cell">Base</SortableHeader>
            <SortableHeader field="currentPrice" align="right">Price</SortableHeader>
            <SortableHeader field="change" align="right">+/-</SortableHeader>
            {isAdmin && (
              <>
                <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Qty
                </th>
                <th className="p-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  <span className="sr-only">Action</span>
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedBeers.map((beer) => {
            const change = getChangePercent(beer);
            const showCategoryBadge = showBadgeForBeer.has(beer.id);
            const beerIsProcessing = isProcessing(beer.id);
            const beerColor = getBeerColor(beer.id, beerColorMap);

            return (
              <tr key={beer.id} className="table-row group">
                <td className="p-4 hidden sm:table-cell">
                  {showCategoryBadge && (
                    <span className={`badge ${CATEGORY_STYLES[beer.category] || ''}`} style={getCategoryBadgeStyle(beer.category, allCategories)}>
                      {beer.category}
                    </span>
                  )}
                </td>
                <td className="p-4 sm:p-4 max-w-[120px] sm:max-w-none">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0"
                      style={{ background: beerColor }}
                    >
                      {beer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{beer.name}</p>
                      <p className="text-xs hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                        Vol: {(beer.volatility * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right tabular-nums hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                  {beer.basePrice.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <span className="text-base sm:text-lg font-bold tabular-nums">
                    {beer.currentPrice.toFixed(2)}
                  </span>
                  <span className="text-xs ml-1 hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>EUR</span>
                </td>
                <td className={`p-4 text-right tabular-nums text-sm sm:text-base ${getChangeClass(change)}`}>
                  <span className="inline-flex items-center">
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    <span className="hidden sm:inline"><PriceArrow change={change} /></span>
                  </span>
                </td>
                {isAdmin && (
                  <>
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        min="1"
                        value={getQuantity(beer.id)}
                        onChange={e => setQuantity(beer.id, e.target.value)}
                        onBlur={() => handleBlur(beer.id)}
                        className="w-16 p-2 text-center text-sm"
                        disabled={isDisabled}
                        aria-label={`Quantity for ${beer.name}`}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleBuy(beer.id)}
                        disabled={isDisabled}
                        className={`btn btn-primary text-sm min-w-[60px] ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={`Buy ${beer.name}`}
                        aria-busy={beerIsProcessing}
                      >
                        {beerIsProcessing ? <SpinnerIcon className="w-4 h-4 border-white border-t-transparent" /> : 'Buy'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
