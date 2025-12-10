import { useState } from 'react';

export interface FilterState {
  priceMin: number | null;
  priceMax: number | null;
  volatilityMin: number | null;
  volatilityMax: number | null;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPrice: number;
  onClear: () => void;
}

export function AdvancedFilters({ filters, onFiltersChange, maxPrice, onClear }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = filters.priceMin !== null || filters.priceMax !== null ||
    filters.volatilityMin !== null || filters.volatilityMax !== null;

  const updateFilter = (key: keyof FilterState, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    onFiltersChange({ ...filters, [key]: numValue });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
          hasActiveFilters
            ? 'bg-accent/20 text-accent ring-1 ring-accent/50'
            : 'hover:bg-white/10'
        }`}
        style={{ background: hasActiveFilters ? undefined : 'var(--bg-tertiary)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-accent" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl shadow-xl border z-50"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-sm">Advanced Filters</h4>
            {hasActiveFilters && (
              <button
                onClick={() => { onClear(); }}
                className="text-xs text-accent hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Price Range (EUR)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin ?? ''}
                onChange={(e) => updateFilter('priceMin', e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                min="0"
                max={maxPrice}
                step="0.5"
              />
              <span style={{ color: 'var(--text-secondary)' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax ?? ''}
                onChange={(e) => updateFilter('priceMax', e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                min="0"
                max={maxPrice}
                step="0.5"
              />
            </div>
          </div>

          {/* Volatility Range */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Volatility (0-100%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.volatilityMin !== null ? Math.round(filters.volatilityMin * 100) : ''}
                onChange={(e) => updateFilter('volatilityMin', e.target.value === '' ? '' : String(parseFloat(e.target.value) / 100))}
                className="flex-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                min="0"
                max="100"
                step="5"
              />
              <span style={{ color: 'var(--text-secondary)' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.volatilityMax !== null ? Math.round(filters.volatilityMax * 100) : ''}
                onChange={(e) => updateFilter('volatilityMax', e.target.value === '' ? '' : String(parseFloat(e.target.value) / 100))}
                className="flex-1 px-3 py-2 text-sm rounded-lg"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                min="0"
                max="100"
                step="5"
              />
            </div>
          </div>

          {/* Quick filters */}
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              <QuickFilterButton
                label="Cheap (<3€)"
                onClick={() => onFiltersChange({ ...filters, priceMin: null, priceMax: 3 })}
                active={filters.priceMax === 3 && filters.priceMin === null}
              />
              <QuickFilterButton
                label="Premium (>5€)"
                onClick={() => onFiltersChange({ ...filters, priceMin: 5, priceMax: null })}
                active={filters.priceMin === 5 && filters.priceMax === null}
              />
              <QuickFilterButton
                label="Stable"
                onClick={() => onFiltersChange({ ...filters, volatilityMin: null, volatilityMax: 0.3 })}
                active={filters.volatilityMax === 0.3 && filters.volatilityMin === null}
              />
              <QuickFilterButton
                label="Volatile"
                onClick={() => onFiltersChange({ ...filters, volatilityMin: 0.4, volatilityMax: null })}
                active={filters.volatilityMin === 0.4 && filters.volatilityMax === null}
              />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-sm rounded-lg transition-colors hover:bg-white/10"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function QuickFilterButton({ label, onClick, active }: { label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-all ${
        active
          ? 'bg-accent text-white'
          : 'hover:bg-white/10'
      }`}
      style={{ background: active ? undefined : 'var(--bg-tertiary)' }}
    >
      {label}
    </button>
  );
}
