import type { Beer, Transaction, MarketStats, ChartData, PurchaseResult, BuyRequest } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Beers
  getBeers: () => fetchJson<Beer[]>('/beers'),
  getBeer: (id: number) => fetchJson<Beer>(`/beers/${id}`),
  getBeersByCategory: (category: string) => fetchJson<Beer[]>(`/beers/category/${category}`),

  // Market
  buy: (request: BuyRequest) =>
    fetchJson<PurchaseResult>('/market/buy', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  reset: () =>
    fetchJson<{ success: boolean; beers: Beer[] }>('/market/reset', {
      method: 'POST',
    }),
  getStats: () => fetchJson<MarketStats>('/market/total'),
  getChartData: () => fetchJson<ChartData>('/market/chart-data'),

  // Transactions
  getTransactions: (limit?: number) =>
    fetchJson<Transaction[]>(`/transactions${limit ? `?limit=${limit}` : ''}`),
  getTransactionCount: () => fetchJson<{ count: number }>('/transactions/count'),
};
