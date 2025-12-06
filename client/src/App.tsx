import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme, useMarket } from './hooks';
import {
  ThemeToggle,
  BeerTable,
  PriceChart,
  TransactionHistory,
  ImpactDialog,
} from './components';

const queryClient = new QueryClient();

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { beers, stats, chartData, lastPurchase, buy, reset, clearLastPurchase } = useMarket();
  const [showHistory, setShowHistory] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showImpactOnBuy, setShowImpactOnBuy] = useState(() => {
    return localStorage.getItem('showImpactOnBuy') !== 'false';
  });

  const toggleShowImpactOnBuy = () => {
    setShowImpactOnBuy(prev => {
      localStorage.setItem('showImpactOnBuy', String(!prev));
      return !prev;
    });
  };

  const handleBuy = (beerId: number, quantity: number) => {
    buy(beerId, quantity);
    if (showImpactOnBuy) {
      setShowImpact(true);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the market?')) {
      reset();
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b shadow-lg"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center shadow-lg shadow-[#e94560]/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-[#e94560]">Bar</span> Boursier
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Stock Market Bar</p>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Market Cap
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats.totalMarketPrice.toFixed(2)}
                  <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>EUR</span>
                </p>
              </div>
              <div className="w-px h-10" style={{ background: 'var(--border-color)' }} />
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Transactions
                </p>
                <p className="text-2xl font-bold tabular-nums">{stats.transactionCount}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleShowImpactOnBuy}
                className={`btn btn-ghost flex items-center gap-2 ${showImpactOnBuy ? 'text-emerald-400' : ''}`}
                style={{ color: showImpactOnBuy ? undefined : 'var(--text-secondary)' }}
                title={showImpactOnBuy ? 'Impact info enabled' : 'Impact info disabled'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Info</span>
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="btn btn-ghost flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={handleReset}
                className="btn btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Reset</span>
              </button>
              <div className="w-px h-8 mx-2" style={{ background: 'var(--border-color)' }} />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="md:hidden flex items-center justify-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Market</p>
              <p className="font-bold">{stats.totalMarketPrice.toFixed(2)} EUR</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Transactions</p>
              <p className="font-bold">{stats.transactionCount}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Price Chart */}
        <section className="card animate-fade-in">
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold">Price History</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Track price movements over time
            </p>
          </div>
          <div className="p-6">
            <PriceChart chartData={chartData} beers={beers} />
          </div>
        </section>

        {/* Beer Table */}
        <section className="card animate-fade-in">
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <h2 className="text-lg font-semibold">Beer Market</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {beers.length} beers available
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-pils">Pils</span>
              <span className="badge badge-abbey">Abbey</span>
              <span className="badge badge-trappist">Trappist</span>
              <span className="badge badge-specialty">Specialty</span>
            </div>
          </div>
          <BeerTable beers={beers} onBuy={handleBuy} />
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 mt-8"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="container mx-auto px-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Bar Boursier - Where beer prices follow the market
        </div>
      </footer>

      {/* Modals */}
      {showHistory && (
        <TransactionHistory onClose={() => setShowHistory(false)} />
      )}

      {showImpact && lastPurchase && (
        <ImpactDialog
          impact={lastPurchase.impact}
          onClose={() => {
            setShowImpact(false);
            clearLastPurchase();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
