// Shared color palette for beers
export const BEER_COLORS = [
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
  '#6366F1', '#14B8A6', '#EAB308', '#EF4444', '#3B82F6',
  '#A855F7', '#22C55E', '#F43F5E', '#0EA5E9',
];

// Predefined sector colors
export const SECTOR_COLORS: Record<string, string> = {
  pils: '#3B82F6',
  abbey: '#F59E0B',
  trappist: '#EF4444',
  specialty: '#10B981',
};

// Reserved hues for predefined sectors (to avoid similar colors)
const RESERVED_SECTOR_HUES: Record<string, number> = {
  pils: 217,      // blue
  abbey: 38,      // amber
  trappist: 0,    // red
  specialty: 160, // green
};

// Generate a deterministic hash from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Get a distinct hue for a new sector
function getDistinctSectorHue(sector: string, existingSectors: string[]): number {
  const usedHues = Object.values(RESERVED_SECTOR_HUES);

  // Add hues from other dynamic sectors
  existingSectors.forEach(s => {
    if (!RESERVED_SECTOR_HUES[s] && s !== sector) {
      usedHues.push(hashString(s) % 360);
    }
  });

  const baseHue = hashString(sector) % 360;

  const minDistance = (hue: number): number => {
    if (usedHues.length === 0) return 360;
    return Math.min(...usedHues.map(used => {
      const diff = Math.abs(hue - used);
      return Math.min(diff, 360 - diff);
    }));
  };

  if (minDistance(baseHue) > 30) {
    return baseHue;
  }

  let bestHue = baseHue;
  let bestDistance = minDistance(baseHue);

  for (let offset = 0; offset < 360; offset += 15) {
    const candidateHue = (baseHue + offset) % 360;
    const distance = minDistance(candidateHue);
    if (distance > bestDistance) {
      bestDistance = distance;
      bestHue = candidateHue;
    }
  }

  return bestHue;
}

// Get color for a sector (for charts)
export function getSectorColor(sector: string, allSectors: string[] = []): string {
  // Use predefined color if available
  if (SECTOR_COLORS[sector]) {
    return SECTOR_COLORS[sector];
  }

  // Generate a distinct color for new sectors
  const hue = getDistinctSectorHue(sector, allSectors);
  return `hsl(${hue}, 70%, 55%)`;
}

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
