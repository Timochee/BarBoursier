type ThemePreference = 'dark' | 'light' | 'auto';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  preference?: ThemePreference;
  onToggle: () => void;
}

// Sun icon
const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
      clipRule="evenodd"
    />
  </svg>
);

// Moon icon
const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

// Auto icon (clock/schedule)
const AutoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);

export function ThemeToggle({ theme, preference = theme === 'dark' ? 'dark' : 'light', onToggle }: ThemeToggleProps) {
  const getLabel = () => {
    if (preference === 'auto') return 'Auto (19h-7h dark)';
    return preference === 'dark' ? 'Dark mode' : 'Light mode';
  };

  const getNextMode = () => {
    if (preference === 'auto') return 'light';
    if (preference === 'light') return 'dark';
    return 'auto';
  };

  return (
    <button
      onClick={onToggle}
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 hover:bg-white/10"
      style={{ background: 'var(--bg-tertiary)' }}
      aria-label={`Current: ${getLabel()}. Click for ${getNextMode()} mode`}
      title={getLabel()}
    >
      {/* Current state icon */}
      {preference === 'light' && <SunIcon className="w-4 h-4 text-yellow-500" />}
      {preference === 'dark' && <MoonIcon className="w-4 h-4 text-blue-400" />}
      {preference === 'auto' && (
        <div className="relative">
          <AutoIcon className="w-4 h-4 text-purple-400" />
          {/* Small indicator showing current auto-selected theme */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-current" style={{ background: theme === 'dark' ? '#60a5fa' : '#eab308' }} />
        </div>
      )}

      {/* Label */}
      <span className="text-xs font-medium hidden sm:inline">
        {preference === 'auto' ? 'Auto' : preference === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
