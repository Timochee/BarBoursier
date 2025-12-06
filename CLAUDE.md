# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bar Boursier is a web-based stock market bar application where beer prices fluctuate based on purchases. The market is **zero-sum**: when some beers go up, others must go down by the same total amount.

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Development (both client and server)
npm run dev:client   # Client only
npm run dev:server   # Server only
npm run build        # Build all workspaces
npm start            # Run production
```

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, Recharts, React Query, Socket.io-client
- **Backend**: Node.js + Express + TypeScript, better-sqlite3, Socket.io

## Architecture

Monorepo structure with client/server separation and shared types:

- `client/` - React frontend with components, hooks, services
- `server/` - Express backend with routes, services, repositories, database
- `shared/` - Shared TypeScript types and pricing constants

### Backend Services
- **PricingService** - Core pricing algorithm (zero-sum, sector correlation, mean reversion)
- **MarketService** - Market operations (buy, reset)
- **ChartDataService** - Price history for charts

### Frontend Hooks
- **useMarket** - Market state management via Socket.io
- **useBeers** - Beer data fetching
- **useTheme** - Dark/light theme support

## Pricing Algorithm

### 1. Effective Volatility
Expensive beers become more stable:
```
priceRatio = clamp(currentPrice / basePrice, 0.5, 2.0)
modifier = clamp(1 - 0.3 × ln(priceRatio), 0.5, 1.2)
effectiveVolatility = beer.volatility × modifier
```

### 2. Price Increase (Purchased Beer)
```
increase = baseMove × effectiveVolatility × currentPrice × √quantity
```
- `baseMove`: 0.45 (configurable in DB)
- `√quantity`: Diminishing returns (4 beers ≠ 4× effect of 1)

### 3. Correlated Increase (Same Sector)
```
relativeVolatility = effectiveVol(beer) / effectiveVol(purchased)
correlatedIncrease = purchasedIncrease × sectorCorrelation × relativeVolatility
```
- `sectorCorrelation`: 0.45 (configurable in DB)

### 4. Mean Reversion
Prices drift back to base price:
```
gapRatio = |currentPrice - basePrice| / basePrice
proportionalStrength = 0.01 × (1 + gapRatio)
correction = (basePrice - currentPrice) × proportionalStrength × sectorMultiplier
```

Sector reversion multipliers (higher = faster return):
- pils: 1.5 (fast)
- abbey: 1.0 (normal)
- specialty: 0.8 (slow)
- trappist: 0.6 (slowest)

### 5. Decrease Weights (Other Sectors)
```
combinedWeight = SECTOR_MATRIX[purchased][beer] × effectiveVolatility
share = combinedWeight / totalWeight
```

Sector Matrix (row buys → column decreases):
|           | pils | abbey | trappist | specialty |
|-----------|------|-------|----------|-----------|
| pils      | -    | 0.8   | 0.5      | 0.3       |
| abbey     | 0.6  | -     | 0.9      | 0.4       |
| trappist  | 0.5  | 0.9   | -        | 0.5       |
| specialty | 0.4  | 0.5   | 0.5      | -         |

### 6. Crash Protection
1. **Max 10% decrease** per transaction per beer
2. **Floor brake**: Near minPrice, decrease is reduced
   ```
   distanceToFloor = (currentPrice - minPrice) / currentPrice
   protectionFactor = min(1.0, distanceToFloor × 2)
   ```
3. **Absolute floor**: minPrice (0.50€)
4. **Redistribution ratio**: If others can't decrease enough, all increases are scaled down

### Constants
| Setting           | Value  | Source      |
|-------------------|--------|-------------|
| baseMove          | 0.45   | settings DB |
| sectorCorrelation | 0.45   | settings DB |
| minPrice          | 0.50€  | settings DB |
| maxPrice          | 25.00€ | settings DB |
| MEAN_REVERSION    | 0.01   | code        |
| MAX_DECREASE      | 10%    | code        |

### Beer Sectors & Volatility
| Sector    | Beers                               | Volatility |
|-----------|-------------------------------------|------------|
| pils      | Jupiler, Stella, Maes               | 0.22-0.25  |
| abbey     | Leffe, Grimbergen, Affligem         | 0.32-0.38  |
| trappist  | Chimay, Orval, Westmalle, Rochefort | 0.45-0.55  |
| specialty | Duvel, Delirium, Kwak, Chouffe      | 0.40-0.50  |

## API Structure

- `GET /api/beers` - All beers
- `POST /api/market/buy` - Buy beer `{ beerId, quantity }`
- `POST /api/market/reset` - Reset market
- `GET /api/market/chart-data` - Chart data
- `GET /api/transactions` - Transaction history

## WebSocket Events

- Client emits: `buy`, `reset`
- Server emits: `pricesUpdated`, `purchaseResult`, `marketReset`
