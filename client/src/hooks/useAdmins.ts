import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { Admin } from 'shared';

export function useAdmins(isSuperadmin: boolean) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (!isSuperadmin) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admins');
    } finally {
      setIsLoading(false);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const addAdmin = useCallback(async (email: string, name: string) => {
    setError(null);
    try {
      const newAdmin = await api.addAdmin(email, name);
      setAdmins((prev) => [newAdmin, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
      return false;
    }
  }, []);

  const removeAdmin = useCallback(async (id: number) => {
    setError(null);
    try {
      await api.removeAdmin(id);
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    admins,
    isLoading,
    error,
    addAdmin,
    removeAdmin,
    clearError,
    refetch: fetchAdmins,
  };
}
