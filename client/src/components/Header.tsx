import { useState, useRef, useEffect } from 'react';
import type { MarketStats } from 'shared';
import { ThemeToggle } from './ThemeToggle';
import { Tooltip } from './Tooltip';
import { HeaderStats, MobileStats } from './HeaderStats';
import {
  MenuIcon,
  ChartIcon,
  TvIcon,
  PlusIcon,
  HistoryIcon,
  PresetIcon,
  UsersIcon,
  ResetIcon,
  CalculatorIcon,
  InfoIcon,
  GoogleIcon,
} from './Icons';

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
  themePreference?: 'dark' | 'light' | 'auto';
  onToggleTheme: () => void;
  onShowBeerManagement: () => void;
  onShowHistory: () => void;
  onShowPresets: () => void;
  onShowAdminManagement: () => void;
  onReset: () => void;
  onEnterBarDisplay: () => void;
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
  themePreference,
  onToggleTheme,
  onShowBeerManagement,
  onShowHistory,
  onShowPresets,
  onShowAdminManagement,
  onReset,
  onEnterBarDisplay,
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
              <ChartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                <span className="text-accent">Bar</span> Boursier
              </h1>
            </div>
          </div>

          {/* Center Stats - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <HeaderStats stats={stats} isLoading={isLoading} />
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
                    <MenuIcon />
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

            {/* TV Mode Button */}
            <Tooltip content="Bar Display (TV Mode)">
              <button
                onClick={onEnterBarDisplay}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <TvIcon />
                <span className="hidden sm:inline">TV</span>
              </button>
            </Tooltip>

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
            <ThemeToggle theme={theme} preference={themePreference} onToggle={onToggleTheme} />
          </div>
        </div>

        {/* Mobile Stats */}
        <MobileStats stats={stats} />
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
      <GoogleIcon />
      <span className="hidden sm:inline">Login</span>
    </button>
  );
}
