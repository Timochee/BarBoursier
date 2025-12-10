import { useState, useRef, useEffect } from 'react';
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
  stats: MarketStats;
  isLoading: boolean;
  isConnected: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onShowBeerManagement: () => void;
  onShowHistory: () => void;
  onShowPresets: () => void;
  onShowAdminManagement: () => void;
  onReset: () => void;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b shadow-lg"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent/30">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                <span className="text-accent">Bar</span> Boursier
              </h1>
            </div>
          </div>

          {/* Center Stats - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {isLoading ? (
              <StatsSkeleton />
            ) : (
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
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Admin Menu */}
            {isAdmin && (
              <div className="relative" ref={menuRef}>
                <Tooltip content="Menu">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`btn btn-ghost p-2 rounded-lg ${menuOpen ? 'bg-white/10' : ''}`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </Tooltip>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                  >
                    {/* Superadmin Section */}
                    {isSuperadmin && (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>
                          Configuration
                        </div>
                        <MenuItem
                          icon={<PlusIcon />}
                          label="Manage Beers"
                          onClick={() => handleMenuAction(onShowBeerManagement)}
                        />
                        <MenuItem
                          icon={<PresetIcon />}
                          label="Presets"
                          onClick={() => handleMenuAction(onShowPresets)}
                          color="text-cyan-400"
                        />
                        <MenuItem
                          icon={<UsersIcon />}
                          label="Manage Admins"
                          onClick={() => handleMenuAction(onShowAdminManagement)}
                          color="text-purple-400"
                        />
                        <MenuItem
                          icon={<ResetIcon />}
                          label="Reset Market"
                          onClick={() => handleMenuAction(onReset)}
                          color="text-red-400"
                        />
                        <div className="h-px" style={{ background: 'var(--border-color)' }} />
                      </>
                    )}

                    {/* Admin Section */}
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>
                      Actions
                    </div>
                    <MenuItem
                      icon={<HistoryIcon />}
                      label="Transaction History"
                      onClick={() => handleMenuAction(onShowHistory)}
                    />

                    <div className="h-px" style={{ background: 'var(--border-color)' }} />

                    {/* Settings Section */}
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)', background: 'var(--bg-tertiary)' }}>
                      Settings
                    </div>
                    <ToggleMenuItem
                      icon={<CalculatorIcon />}
                      label="Keep Quantity"
                      description="Keep quantity after purchase"
                      active={keepQuantity}
                      onClick={onToggleKeepQuantity}
                    />
                    <ToggleMenuItem
                      icon={<InfoIcon />}
                      label="Show Impact"
                      description="Show price impact popup"
                      active={showImpactOnBuy}
                      onClick={onToggleShowImpactOnBuy}
                    />
                  </div>
                )}
              </div>
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
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>

        {/* Mobile Stats */}
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
      </div>
    </header>
  );
}

// Menu Item Component
function MenuItem({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors ${color || ''}`}
      style={{ color: color ? undefined : 'var(--text-primary)' }}
    >
      <span className="w-5 h-5">{icon}</span>
      {label}
    </button>
  );
}

// Toggle Menu Item Component
function ToggleMenuItem({ icon, label, description, active, onClick }: { icon: React.ReactNode; label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
    >
      <span className={`w-5 h-5 ${active ? 'text-emerald-400' : ''}`} style={{ color: active ? undefined : 'var(--text-secondary)' }}>{icon}</span>
      <div className="flex-1 text-left">
        <div style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{description}</div>
      </div>
      <div className={`w-8 h-5 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

// Connection status indicator
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <Tooltip content={isConnected ? 'Connected' : 'Disconnected'}>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-default ${
          isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
      </div>
    </Tooltip>
  );
}

// User auth component
function UserAuth({ isLoggedIn, isAdmin, isSuperadmin, isAuthLoading, user, onLogin, onLogout }: {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isAuthLoading: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const getRoleLabel = () => {
    if (isSuperadmin) return 'Superadmin';
    if (isAdmin) return 'Admin';
    return 'Guest';
  };

  const getColorClass = () => {
    if (isSuperadmin) return 'text-purple-400';
    if (isAdmin) return 'text-amber-400';
    return '';
  };

  if (isLoggedIn) {
    return (
      <Tooltip content={`${user?.name || user?.email} (${getRoleLabel()})`}>
        <button
          onClick={onLogout}
          className={`btn btn-ghost flex items-center gap-2 ${getColorClass()}`}
        >
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center">
              <span className="text-xs font-medium">{user?.name?.[0] || '?'}</span>
            </div>
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={onLogin}
      disabled={isAuthLoading}
      className="btn btn-ghost flex items-center gap-2 text-sm"
      style={{ color: 'var(--text-secondary)' }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span className="hidden sm:inline">Login</span>
    </button>
  );
}

// Icons
const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const HistoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PresetIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ResetIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CalculatorIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
