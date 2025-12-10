import type React from 'react';
import { getSectorColor } from './colors';

// Shared category badge style mappings (CSS classes)
export const CATEGORY_STYLES: Record<string, string> = {
  pils: 'badge-pils',
  abbey: 'badge-abbey',
  trappist: 'badge-trappist',
  specialty: 'badge-specialty',
};

// Get inline styles for a dynamic category badge
// Uses the same color as the chart for consistency
export function getCategoryBadgeStyle(category: string, existingCategories: string[] = []): React.CSSProperties | undefined {
  // If it's a predefined category, use CSS class (return undefined for inline style)
  if (CATEGORY_STYLES[category]) {
    return undefined;
  }

  // Get the same color used in the chart
  const color = getSectorColor(category, existingCategories);

  return {
    backgroundColor: color.replace(')', ', 0.2)').replace('hsl(', 'hsla('),
    color: color,
  };
}

// Default volatility by category (used for beer form)
export const DEFAULT_VOLATILITY: Record<string, number> = {
  pils: 0.23,
  abbey: 0.35,
  trappist: 0.50,
  specialty: 0.45,
};
