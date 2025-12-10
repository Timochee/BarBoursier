import type { Beer } from 'shared';
import { DEFAULT_SETTINGS, VALIDATION } from 'shared';

// Round price to 2 decimal places
export function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

// Convert beers array to price records for history
export function beersToRecords(beers: Beer[]): { beerId: number; price: number }[] {
  return beers.map(b => ({ beerId: b.id, price: b.currentPrice }));
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Validate beer fields (for create)
export function validateBeerCreate(data: {
  name?: unknown;
  basePrice?: unknown;
  category?: unknown;
  volatility?: unknown;
}): ValidationResult {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (typeof data.basePrice !== 'number' || data.basePrice < DEFAULT_SETTINGS.minPrice || data.basePrice > DEFAULT_SETTINGS.maxPrice) {
    return { valid: false, error: `Base price must be between ${DEFAULT_SETTINGS.minPrice} and ${DEFAULT_SETTINGS.maxPrice}` };
  }

  if (!data.category || typeof data.category !== 'string' || data.category.trim().length === 0) {
    return { valid: false, error: 'Category is required' };
  }

  if (typeof data.volatility !== 'number' || data.volatility < VALIDATION.volatility.min || data.volatility > VALIDATION.volatility.max) {
    return { valid: false, error: `Volatility must be between ${VALIDATION.volatility.min} and ${VALIDATION.volatility.max}` };
  }

  return { valid: true };
}

// Validate beer fields (for update - all optional)
export function validateBeerUpdate(data: {
  name?: unknown;
  basePrice?: unknown;
  category?: unknown;
  volatility?: unknown;
}): ValidationResult {
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (data.basePrice !== undefined && (typeof data.basePrice !== 'number' || data.basePrice < DEFAULT_SETTINGS.minPrice || data.basePrice > DEFAULT_SETTINGS.maxPrice)) {
    return { valid: false, error: `Base price must be between ${DEFAULT_SETTINGS.minPrice} and ${DEFAULT_SETTINGS.maxPrice}` };
  }

  if (data.category !== undefined && (typeof data.category !== 'string' || data.category.trim().length === 0)) {
    return { valid: false, error: 'Category cannot be empty' };
  }

  if (data.volatility !== undefined && (typeof data.volatility !== 'number' || data.volatility < VALIDATION.volatility.min || data.volatility > VALIDATION.volatility.max)) {
    return { valid: false, error: `Volatility must be between ${VALIDATION.volatility.min} and ${VALIDATION.volatility.max}` };
  }

  return { valid: true };
}
