import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useBeers() {
  return useQuery({
    queryKey: ['beers'],
    queryFn: api.getBeers,
  });
}

export function useBeersByCategory(category: string) {
  return useQuery({
    queryKey: ['beers', 'category', category],
    queryFn: () => api.getBeersByCategory(category),
  });
}
