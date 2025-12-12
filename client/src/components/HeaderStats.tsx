import type { MarketStats } from 'shared';
import { StatsSkeleton } from './Skeleton';

interface HeaderStatsProps {
  stats: MarketStats;
  isLoading: boolean;
}

// Desktop stats display
export function HeaderStats({ stats, isLoading }: HeaderStatsProps) {
  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <>
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Market Cap
        </p>
        <p className="text-xl font-bold tabular-nums">
          {stats.totalMarketPrice.toFixed(2)}
          <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>€</span>
        </p>
      </div>
      <div className="w-px h-8" style={{ background: 'var(--border-color)' }} />
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          Transactions
        </p>
        <p className="text-xl font-bold tabular-nums">{stats.transactionCount}</p>
      </div>
    </>
  );
}

// Mobile stats display
export function MobileStats({ stats }: { stats: MarketStats }) {
  return (
    <div className="md:hidden flex items-center justify-center gap-6 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <div className="text-center">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Market</p>
        <p className="font-bold">{stats.totalMarketPrice.toFixed(2)} €</p>
      </div>
      <div className="text-center">
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Transactions</p>
        <p className="font-bold">{stats.transactionCount}</p>
      </div>
    </div>
  );
}
