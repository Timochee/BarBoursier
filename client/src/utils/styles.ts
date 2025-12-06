// Shared category badge style mappings
export const CATEGORY_STYLES: Record<string, string> = {
  pils: 'badge-pils',
  abbey: 'badge-abbey',
  trappist: 'badge-trappist',
  specialty: 'badge-specialty',
};

// Default volatility by category (used for beer form)
export const DEFAULT_VOLATILITY: Record<string, number> = {
  pils: 0.23,
  abbey: 0.35,
  trappist: 0.50,
  specialty: 0.45,
};
