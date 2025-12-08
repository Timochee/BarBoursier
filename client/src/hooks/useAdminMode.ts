import { useState, useCallback, useEffect } from 'react';
import { api, getToken, removeToken, handleAuthCallback, getGoogleAuthUrl, UserInfo } from '../services/api';

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Handle OAuth callback and verify token on mount
  useEffect(() => {
    // First, check for OAuth callback params in URL
    const { token, error } = handleAuthCallback();

    if (error) {
      setAuthError(error);
      setIsLoading(false);
      return;
    }

    // If we have a token (from callback or localStorage), verify it
    const existingToken = token || getToken();
    if (existingToken) {
      api.verify()
        .then((response) => {
          setIsLoggedIn(response.valid);
          setIsAdmin(response.valid && response.isAdmin);
          setIsSuperadmin(response.valid && response.isSuperadmin);
          if (response.user) {
            setUser(response.user);
          }
        })
        .catch(() => {
          // Token invalid, remove it
          removeToken();
          setIsLoggedIn(false);
          setIsAdmin(false);
          setIsSuperadmin(false);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(() => {
    // Redirect to Google OAuth
    window.location.href = getGoogleAuthUrl();
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsSuperadmin(false);
    setUser(null);
    // Optionally call the logout endpoint for logging
    api.logout().catch(() => {
      // Ignore errors on logout
    });
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    isAdmin,
    isSuperadmin,
    isLoggedIn,
    isLoading,
    authError,
    user,
    login,
    logout,
    clearAuthError,
  };
}
