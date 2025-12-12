import type { Beer } from 'shared';
import { ArrowUpIcon, ArrowDownIcon } from '../components/Icons';

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
    return <ArrowUpIcon className={`${className} inline-block ml-1`} />;
  }
  if (change < 0) {
    return <ArrowDownIcon className={`${className} inline-block ml-1`} />;
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
