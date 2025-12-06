export interface Beer {
  id: number;
  name: string;
  basePrice: number;
  currentPrice: number;
  category: string;
  volatility: number;
}

export interface Transaction {
  id: number;
  beerId: number;
  beerName: string;
  quantity: number;
  timestamp: string;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseResult {
  beer: Beer;
  impact: PurchaseImpact;
}

export interface PurchaseImpact {
  purchasedBeerName: string;
  quantity: number;
  sectorChanges: Record<string, number>;
  beerChanges: Record<string, Record<string, number>>;
}

export interface ChartData {
  timeLabels: string[];
  sectorPriceHistory: Record<string, number[]>;
  beerPriceHistory: Record<number, number[]>;
  transactionCount: number;
}

export interface MarketStats {
  totalMarketPrice: number;
  transactionCount: number;
}

export interface BuyRequest {
  beerId: number;
  quantity: number;
}

export interface Settings {
  baseMove: number;
  sectorCorrelation: number;
  minPrice: number;
  maxPrice: number;
}

export const DEFAULT_SETTINGS: Settings = {
  baseMove: 0.45,
  sectorCorrelation: 0.45,
  minPrice: 0.50,
  maxPrice: 25.00,
};

// Pricing algorithm constants
export const MEAN_REVERSION_BASE_STRENGTH = 0.01;
export const MAX_DECREASE_RATIO = 0.10; // 10% max decrease per transaction

// Sector reversion multipliers - how fast each sector returns to base price
// Higher = faster return to base
export const SECTOR_REVERSION_MULTIPLIERS: Record<string, number> = {
  pils: 1.5,      // Fast return - stable beers
  abbey: 1.0,     // Normal return
  specialty: 0.8, // Slow return
  trappist: 0.6,  // Slowest return - stays "deregulated" longer
};

// Sector correlation matrix for price decreases
// Reading: buying [row] causes [column] to decrease by this weight
export const SECTOR_MATRIX: Record<string, Record<string, number>> = {
  pils: { abbey: 0.8, trappist: 0.5, specialty: 0.3 },
  abbey: { pils: 0.6, trappist: 0.9, specialty: 0.4 },
  trappist: { pils: 0.5, abbey: 0.9, specialty: 0.5 },
  specialty: { pils: 0.4, abbey: 0.5, trappist: 0.5 },
};
