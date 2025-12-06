import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useTransactions(limit?: number) {
  return useQuery({
    queryKey: ['transactions', limit],
    queryFn: () => api.getTransactions(limit),
  });
}
