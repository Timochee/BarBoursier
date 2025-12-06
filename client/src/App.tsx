import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme, useMarket, useToast, useAdminMode } from './hooks';
import {
  ThemeToggle,
  BeerTable,
  PriceChart,
  TransactionHistory,
  ImpactDialog,
  ToastContainer,
  BeerTableSkeleton,
  ChartSkeleton,
  StatsSkeleton,
  ConfirmDialog,
  BeerManagement,
  Tooltip,
  AdminLogin,
} from './components';

const queryClient = new QueryClient();

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast, success, error, warning } = useToast();
  const { isAdmin, showLoginModal, login, logout, openLoginModal, closeLoginModal } = useAdminMode();

  const handleConnect = useCallback(() => {
    success('Connected to market');
  }, [success]);

  const handleDisconnect = useCallback(() => {
    warning('Disconnected from market');
  }, [warning]);

  const handleError = useCallback((msg: string) => {
    error(msg);
  }, [error]);

  const { beers, stats, chartData, lastPurchase, isConnected, isLoading, buy, reset, clearLastPurchase } = useMarket({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
  });

  const [showHistory, setShowHistory] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showBeerManagement, setShowBeerManagement] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showImpactOnBuy, setShowImpactOnBuy] = useState(() => {
    return localStorage.getItem('showImpactOnBuy') !== 'false';
  });
  const [keepQuantity, setKeepQuantity] = useState(() => {
    return localStorage.getItem('keepQuantity') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleShowImpactOnBuy = () => {
    setShowImpactOnBuy(prev => {
      localStorage.setItem('showImpactOnBuy', String(!prev));
      return !prev;
    });
  };

  const toggleKeepQuantity = () => {
    setKeepQuantity(prev => {
      localStorage.setItem('keepQuantity', String(!prev));
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
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    reset();
    setShowResetConfirm(false);
    success('Market has been reset');
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
              {isLoading ? (
                <StatsSkeleton />
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Admin Actions - Only visible in admin mode */}
              {isAdmin && (
                <>
                  <Tooltip content="Add, edit or remove beers">
                    <button
                      onClick={() => setShowBeerManagement(true)}
                      className="btn btn-ghost flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="hidden sm:inline">Beers</span>
                    </button>
                  </Tooltip>
                  <Tooltip content="View transaction history">
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
                  </Tooltip>

                  <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />

                  {/* Settings/Options */}
                  <Tooltip content={keepQuantity ? 'Quantity is kept after purchase' : 'Quantity resets to 1 after purchase'}>
                    <button
                      onClick={toggleKeepQuantity}
                      className={`btn btn-ghost flex items-center gap-2 ${keepQuantity ? 'text-amber-400' : ''}`}
                      style={{ color: keepQuantity ? undefined : 'var(--text-secondary)' }}
                      aria-pressed={keepQuantity}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Keep Qty</span>
                    </button>
                  </Tooltip>
                  <Tooltip content={showImpactOnBuy ? 'Shows price impact after each purchase' : 'Price impact info is hidden after purchase'}>
                    <button
                      onClick={toggleShowImpactOnBuy}
                      className={`btn btn-ghost flex items-center gap-2 ${showImpactOnBuy ? 'text-emerald-400' : ''}`}
                      style={{ color: showImpactOnBuy ? undefined : 'var(--text-secondary)' }}
                      aria-pressed={showImpactOnBuy}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Impact</span>
                    </button>
                  </Tooltip>

                  <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />

                  {/* Danger Action */}
                  <Tooltip content="Reset all prices to base values">
                    <button
                      onClick={handleReset}
                      className="btn btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </Tooltip>

                  <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />
                </>
              )}

              {/* Status & Theme - Always visible */}
              <Tooltip content={isConnected ? 'Connected to server in real-time' : 'Connection to server lost'}>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-default ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </Tooltip>

              {/* Admin Toggle */}
              <Tooltip content={isAdmin ? 'Logout from admin mode' : 'Login as admin'}>
                <button
                  onClick={isAdmin ? logout : openLoginModal}
                  className={`btn btn-ghost flex items-center gap-2 ${isAdmin ? 'text-amber-400' : ''}`}
                  style={{ color: isAdmin ? undefined : 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isAdmin ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                  <span className="hidden sm:inline">{isAdmin ? 'Admin' : 'Login'}</span>
                </button>
              </Tooltip>

              <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
              </Tooltip>
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
        {/* Beer Table - Primary action area */}
        <section className="card animate-fade-in">
          <div
            className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Beer Market</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isLoading ? 'Loading...' : `${beers.length} beers available`}
                </p>
              </div>
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-secondary)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm rounded-lg w-40 sm:w-48"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                  aria-label="Search beers"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Clear search"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2" aria-label="Filter by category">
              <button
                onClick={() => { setCategoryFilter(null); setSearchQuery(''); }}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  categoryFilter || searchQuery ? 'hover:bg-white/10 opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{ color: 'var(--text-secondary)' }}
                tabIndex={categoryFilter || searchQuery ? 0 : -1}
              >
                Clear
              </button>
              {(['pils', 'abbey', 'trappist', 'specialty'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className={`badge badge-${cat} cursor-pointer transition-all ${
                    categoryFilter === null
                      ? 'opacity-100'
                      : categoryFilter === cat
                        ? 'opacity-100 ring-2 ring-white/50'
                        : 'opacity-40'
                  }`}
                  aria-pressed={categoryFilter === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <BeerTableSkeleton />
          ) : (
            <BeerTable
              beers={beers}
              onBuy={handleBuy}
              keepQuantity={keepQuantity}
              categoryFilter={categoryFilter}
              searchQuery={searchQuery}
              isAdmin={isAdmin}
            />
          )}
        </section>

        {/* Price Chart - Visualization */}
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
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <PriceChart chartData={chartData} beers={beers} />
            )}
          </div>
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

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset Market"
          message="Are you sure you want to reset the market? All prices will return to their base values and transaction history will be cleared."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {showBeerManagement && (
        <BeerManagement
          beers={beers}
          onClose={() => setShowBeerManagement(false)}
          onSuccess={(msg) => {
            success(msg);
          }}
          onError={(msg) => {
            error(msg);
          }}
        />
      )}

      {showLoginModal && (
        <AdminLogin
          onLogin={login}
          onClose={closeLoginModal}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
