import type { MarketStats } from 'shared';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { StatsSkeleton } from './Skeleton';

interface User {
  email: string;
  name?: string;
  picture?: string;
}

interface HeaderProps {
  // Stats
  stats: MarketStats;
  isLoading: boolean;
  isConnected: boolean;

  // Auth
  isAdmin: boolean;
  isSuperadmin: boolean;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;

  // Theme
  theme: 'dark' | 'light';
  onToggleTheme: () => void;

  // Admin actions
  onShowBeerManagement: () => void;
  onShowHistory: () => void;
  onShowPresets: () => void;
  onShowAdminManagement: () => void;
  onReset: () => void;

  // Settings
  keepQuantity: boolean;
  showImpactOnBuy: boolean;
  onToggleKeepQuantity: () => void;
  onToggleShowImpactOnBuy: () => void;
}

export function Header({
  stats,
  isLoading,
  isConnected,
  isAdmin,
  isSuperadmin,
  isLoggedIn,
  isAuthLoading,
  user,
  onLogin,
  onLogout,
  theme,
  onToggleTheme,
  onShowBeerManagement,
  onShowHistory,
  onShowPresets,
  onShowAdminManagement,
  onReset,
  keepQuantity,
  showImpactOnBuy,
  onToggleKeepQuantity,
  onToggleShowImpactOnBuy,
}: HeaderProps) {
  return (
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

          {/* Desktop Stats */}
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
            {/* Admin Actions */}
            {isAdmin && (
              <>
                {isSuperadmin && (
                  <Tooltip content="Add, edit or remove beers">
                    <button
                      onClick={onShowBeerManagement}
                      className="btn btn-ghost flex items-center gap-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="hidden sm:inline">Beers</span>
                    </button>
                  </Tooltip>
                )}
                <Tooltip content="View transaction history">
                  <button
                    onClick={onShowHistory}
                    className="btn btn-ghost flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">History</span>
                  </button>
                </Tooltip>
                {isSuperadmin && (
                  <Tooltip content="Save and load beer presets">
                    <button
                      onClick={onShowPresets}
                      className="btn btn-ghost flex items-center gap-2 text-cyan-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="hidden sm:inline">Presets</span>
                    </button>
                  </Tooltip>
                )}
                {isSuperadmin && (
                  <Tooltip content="Manage admin users">
                    <button
                      onClick={onShowAdminManagement}
                      className="btn btn-ghost flex items-center gap-2 text-purple-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="hidden sm:inline">Admins</span>
                    </button>
                  </Tooltip>
                )}

                <Separator />

                {/* Settings */}
                <Tooltip content={keepQuantity ? 'Quantity is kept after purchase' : 'Quantity resets to 1 after purchase'}>
                  <button
                    onClick={onToggleKeepQuantity}
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
                    onClick={onToggleShowImpactOnBuy}
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

                <Separator />

                {/* Reset - Superadmin only */}
                {isSuperadmin && (
                  <Tooltip content="Reset all prices to base values">
                    <button
                      onClick={onReset}
                      className="btn btn-ghost flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </Tooltip>
                )}

                <Separator />
              </>
            )}

            {/* Connection Status */}
            <ConnectionStatus isConnected={isConnected} />

            {/* User Auth */}
            <UserAuth
              isLoggedIn={isLoggedIn}
              isAdmin={isAdmin}
              isSuperadmin={isSuperadmin}
              isAuthLoading={isAuthLoading}
              user={user}
              onLogin={onLogin}
              onLogout={onLogout}
            />

            {/* Theme Toggle */}
            <Tooltip content={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
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
  );
}

// Helper component for visual separator
function Separator() {
  return <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />;
}

// Connection status indicator component
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
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
  );
}

// User authentication component
interface UserAuthProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isAuthLoading: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

function UserAuth({ isLoggedIn, isAdmin, isSuperadmin, isAuthLoading, user, onLogin, onLogout }: UserAuthProps) {
  const getRoleLabel = () => {
    if (isSuperadmin) return ' (Superadmin)';
    if (isAdmin) return ' (Admin)';
    return '';
  };

  const getColorClass = () => {
    if (isSuperadmin) return 'text-purple-400';
    if (isAdmin) return 'text-amber-400';
    return '';
  };

  if (isLoggedIn) {
    return (
      <Tooltip content={`${user?.name || user?.email}${getRoleLabel()}`}>
        <button
          onClick={onLogout}
          className={`btn btn-ghost flex items-center gap-2 ${getColorClass()}`}
          style={{ color: (isAdmin || isSuperadmin) ? undefined : 'var(--text-primary)' }}
        >
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          <span className="hidden sm:inline">{user?.name?.split(' ')[0] || 'Logout'}</span>
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Login with Google">
      <button
        onClick={onLogin}
        disabled={isAuthLoading}
        className="btn btn-ghost flex items-center gap-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="hidden sm:inline">Login</span>
      </button>
    </Tooltip>
  );
}
