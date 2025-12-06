// Shared color palette for beers
export const BEER_COLORS = [
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
  '#6366F1', '#14B8A6', '#EAB308', '#EF4444', '#3B82F6',
  '#A855F7', '#22C55E', '#F43F5E', '#0EA5E9',
];

export const SECTOR_COLORS: Record<string, string> = {
  pils: '#3B82F6',
  abbey: '#F59E0B',
  trappist: '#EF4444',
  specialty: '#10B981',
};

// Create a stable color map for beers based on their ID
// This ensures consistent colors across all components
export function createBeerColorMap(beers: { id: number }[]): Map<number, string> {
  const colorMap = new Map<number, string>();

  // Sort by ID to ensure consistent ordering
  const sortedBeers = [...beers].sort((a, b) => a.id - b.id);

  sortedBeers.forEach((beer, index) => {
    colorMap.set(beer.id, BEER_COLORS[index % BEER_COLORS.length]);
  });

  return colorMap;
}

// Get color for a specific beer by ID
export function getBeerColor(beerId: number, colorMap: Map<number, string>): string {
  return colorMap.get(beerId) || '#888888';
}
