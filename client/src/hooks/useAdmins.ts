import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useAdmins(isSuperadmin: boolean) {
  const queryClient = useQueryClient();

  const { data: admins = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: api.getAdmins,
    enabled: isSuperadmin,
  });

  const addAdminMutation = useMutation({
    mutationFn: ({ email, name }: { email: string; name: string }) =>
      api.addAdmin(email, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: (id: number) => api.removeAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });

  // Backward-compatible wrapper that returns boolean
  const addAdmin = async (email: string, name: string): Promise<boolean> => {
    try {
      await addAdminMutation.mutateAsync({ email, name });
      return true;
    } catch {
      return false;
    }
  };

  // Backward-compatible wrapper that returns boolean
  const removeAdmin = async (id: number): Promise<boolean> => {
    try {
      await removeAdminMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    admins,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    addAdmin,
    removeAdmin,
    clearError: () => {}, // No-op for backward compatibility
    refetch,
  };
}
