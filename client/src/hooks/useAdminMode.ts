import { useState, useCallback } from 'react';

const ADMIN_PASSWORD = 'admin'; // TODO: Move to environment variable
const STORAGE_KEY = 'barboursier_admin';

export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const login = useCallback((password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setShowLoginModal(false);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const openLoginModal = useCallback(() => {
    setShowLoginModal(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  return {
    isAdmin,
    showLoginModal,
    login,
    logout,
    openLoginModal,
    closeLoginModal,
  };
}
