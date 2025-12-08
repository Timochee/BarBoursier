import type { Beer } from 'shared';

// Get CSS class for price change styling
export function getChangeClass(change: number): string {
  if (change > 0) return 'price-up';
  if (change < 0) return 'price-down';
  return 'price-neutral';
}

// Calculate percentage change from base price
export function getChangePercent(beer: Beer): number {
  return ((beer.currentPrice - beer.basePrice) / beer.basePrice) * 100;
}

// Arrow icon for price changes (up/down/neutral)
export function PriceArrow({ change, className = 'w-4 h-4' }: { change: number; className?: string }) {
  if (change > 0) {
    return (
      <svg className={`${className} inline-block ml-1`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  if (change < 0) {
    return (
      <svg className={`${className} inline-block ml-1`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  return null;
}

// Icon variant that shows a dash for neutral (used in ImpactDialog)
export function PriceChangeIcon({ change, className = 'w-4 h-4' }: { change: number; className?: string }) {
  if (change > 0 || change < 0) {
    return <PriceArrow change={change} className={className} />;
  }
  return <span className={`${className} inline-block text-center`}>-</span>;
}

// Format price change with sign prefix
export function formatPriceChange(change: number, decimals = 2): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}`;
}

// Format percentage change with sign prefix
export function formatPercentChange(change: number, decimals = 1): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(decimals)}%`;
}
