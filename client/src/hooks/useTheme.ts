import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';
type ThemePreference = 'dark' | 'light' | 'auto';

// Dark mode between 19h and 7h
function getAutoTheme(): Theme {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? 'dark' : 'light';
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem('themePreference') as ThemePreference | null;
    return stored || 'auto';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const pref = localStorage.getItem('themePreference') as ThemePreference | null;
    if (pref === 'auto' || !pref) {
      return getAutoTheme();
    }
    return pref;
  });

  // Update theme when preference changes or on auto mode time check
  useEffect(() => {
    if (preference === 'auto') {
      setTheme(getAutoTheme());
      // Check every minute for auto mode
      const interval = setInterval(() => {
        setTheme(getAutoTheme());
      }, 60000);
      return () => clearInterval(interval);
    } else {
      setTheme(preference);
    }
  }, [preference]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('themePreference', preference);
  }, [preference]);

  const toggleTheme = useCallback(() => {
    setPreference(prev => {
      // Cycle: auto -> light -> dark -> auto
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  }, []);

  return { theme, preference, toggleTheme };
}
