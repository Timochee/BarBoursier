import type { Beer, Transaction, MarketStats, ChartData, PurchaseResult, BuyRequest } from 'shared';

const API_BASE = '/api';
const TOKEN_KEY = 'barboursier_token';

export interface CreateBeerRequest {
  name: string;
  basePrice: number;
  category: string;
  volatility: number;
}

export interface UpdateBeerRequest {
  name?: string;
  basePrice?: number;
  category?: string;
  volatility?: number;
}

export interface ApiError {
  error: string;
}

export interface UserInfo {
  email: string;
  name: string;
  picture: string;
}

export interface VerifyResponse {
  valid: boolean;
  isAdmin: boolean;
  user?: UserInfo;
}

// Token management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Handle auth token from URL (after Google OAuth callback)
export function handleAuthCallback(): { token?: string; error?: string } {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');
  const error = params.get('auth_error');

  // Clean up URL
  if (token || error) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (token) {
    setToken(token);
    return { token };
  }

  if (error) {
    return { error };
  }

  return {};
}

// Get Google OAuth URL
export function getGoogleAuthUrl(): string {
  return `${API_BASE}/auth/google`;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth
  verify: () => fetchJson<VerifyResponse>('/auth/verify'),
  logout: () =>
    fetchJson<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  // Beers
  getBeers: () => fetchJson<Beer[]>('/beers'),
  getBeer: (id: number) => fetchJson<Beer>(`/beers/${id}`),
  getBeersByCategory: (category: string) => fetchJson<Beer[]>(`/beers/category/${category}`),
  getCategories: () => fetchJson<string[]>('/beers/categories'),
  createBeer: (beer: CreateBeerRequest) =>
    fetchJson<Beer>('/beers', {
      method: 'POST',
      body: JSON.stringify(beer),
    }),
  updateBeer: (id: number, beer: UpdateBeerRequest) =>
    fetchJson<Beer>(`/beers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(beer),
    }),
  deleteBeer: (id: number) =>
    fetchJson<{ success: boolean; message: string }>(`/beers/${id}`, {
      method: 'DELETE',
    }),

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
