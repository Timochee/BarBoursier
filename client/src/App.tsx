import { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme, useMarket, useToast, useAdminMode, useAdmins, usePresets } from './hooks';
import {
  Header,
  BeerTable,
  PriceChart,
  TransactionHistory,
  ImpactDialog,
  ToastContainer,
  BeerTableSkeleton,
  ChartSkeleton,
  ConfirmDialog,
  BeerManagement,
  AdminManagement,
  PresetManagement,
} from './components';
import { CATEGORY_STYLES, getCategoryBadgeStyle } from './utils/styles';

const queryClient = new QueryClient();

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { toasts, removeToast, success, error, warning } = useToast();
  const { isAdmin, isSuperadmin, isLoggedIn, isLoading: isAuthLoading, authError, user, login, logout, clearAuthError } = useAdminMode();
  const { admins, isLoading: isAdminsLoading, addAdmin, removeAdmin, error: adminsError, clearError: clearAdminsError } = useAdmins(isSuperadmin);
  const { presets, isLoading: isPresetsLoading, saveCurrent: saveCurrentPreset, loadPreset, deletePreset } = usePresets();

  // Show admins error if present
  useEffect(() => {
    if (adminsError) {
      error(adminsError);
      clearAdminsError();
    }
  }, [adminsError, error, clearAdminsError]);

  // Show auth error if present
  useEffect(() => {
    if (authError) {
      error(authError);
      clearAuthError();
    }
  }, [authError, error, clearAuthError]);

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBeerManagement, setShowBeerManagement] = useState(false);
  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [showPresetManagement, setShowPresetManagement] = useState(false);
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

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    success('Logged out successfully');
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Header
        stats={stats}
        isLoading={isLoading}
        isConnected={isConnected}
        isAdmin={isAdmin}
        isSuperadmin={isSuperadmin}
        isLoggedIn={isLoggedIn}
        isAuthLoading={isAuthLoading}
        user={user}
        onLogin={login}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onShowBeerManagement={() => setShowBeerManagement(true)}
        onShowHistory={() => setShowHistory(true)}
        onShowPresets={() => setShowPresetManagement(true)}
        onShowAdminManagement={() => setShowAdminManagement(true)}
        onReset={handleReset}
        keepQuantity={keepQuantity}
        showImpactOnBuy={showImpactOnBuy}
        onToggleKeepQuantity={toggleKeepQuantity}
        onToggleShowImpactOnBuy={toggleShowImpactOnBuy}
      />

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
              {(() => {
                const categories = [...new Set(beers.map(b => b.category))].sort();
                return categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className={`badge ${CATEGORY_STYLES[cat] || ''} cursor-pointer transition-all capitalize ${
                      categoryFilter === null
                        ? 'opacity-100'
                        : categoryFilter === cat
                          ? 'opacity-100 ring-2 ring-white/50'
                          : 'opacity-40'
                    }`}
                    style={getCategoryBadgeStyle(cat, categories)}
                    aria-pressed={categoryFilter === cat}
                  >
                    {cat}
                  </button>
                ));
              })()}
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

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Logout"
          message="Are you sure you want to logout?"
          confirmLabel="Logout"
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
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

      {showAdminManagement && user && (
        <AdminManagement
          admins={admins}
          isLoading={isAdminsLoading}
          currentUserEmail={user.email}
          onClose={() => setShowAdminManagement(false)}
          onAdd={addAdmin}
          onRemove={removeAdmin}
          onSuccess={(msg) => {
            success(msg);
          }}
          onError={(msg) => {
            error(msg);
          }}
        />
      )}

      {showPresetManagement && (
        <PresetManagement
          presets={presets}
          isLoading={isPresetsLoading}
          onClose={() => setShowPresetManagement(false)}
          onSaveCurrent={saveCurrentPreset}
          onLoad={loadPreset}
          onDelete={deletePreset}
          onSuccess={(msg) => {
            success(msg);
          }}
          onError={(msg) => {
            error(msg);
          }}
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
