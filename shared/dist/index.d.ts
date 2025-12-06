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
export declare const DEFAULT_SETTINGS: Settings;
export declare const MEAN_REVERSION_BASE_STRENGTH = 0.01;
export declare const MAX_DECREASE_RATIO = 0.1;
export declare const SECTOR_REVERSION_MULTIPLIERS: Record<string, number>;
export declare const SECTOR_MATRIX: Record<string, Record<string, number>>;
