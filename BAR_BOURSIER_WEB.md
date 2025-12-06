# Bar Boursier - Web Version

## Project Overview

Web-based version of "Bar Boursier" - a stock market bar application where beer prices fluctuate based on purchases. The market is **zero-sum**: when some beers go up, others must go down by the same total amount.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling (dark/light theme support)
- **Recharts** for price charts
- **React Query** for server state management
- **Socket.io-client** for real-time updates

### Backend
- **Node.js** with Express
- **TypeScript**
- **better-sqlite3** for SQLite database
- **Socket.io** for WebSocket connections

## Project Structure

```
bar-boursier-web/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── BeerTable.tsx
│   │   │   ├── PriceChart.tsx
│   │   │   ├── TransactionHistory.tsx
│   │   │   ├── ImpactDialog.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── hooks/
│   │   │   ├── useBeers.ts
│   │   │   ├── useMarket.ts
│   │   │   └── useTheme.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── beers.ts
│   │   │   ├── market.ts
│   │   │   └── transactions.ts
│   │   ├── services/
│   │   │   ├── PricingService.ts
│   │   │   ├── MarketService.ts
│   │   │   └── ChartDataService.ts
│   │   ├── repositories/
│   │   │   ├── BeerRepository.ts
│   │   │   ├── TransactionRepository.ts
│   │   │   └── SettingsRepository.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   └── init.sql
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                    # Shared types
│   └── types.ts
│
└── package.json               # Workspace root
```

## Commands

```bash
# Install all dependencies
npm install

# Development (runs both client and server)
npm run dev

# Client only
npm run dev:client

# Server only
npm run dev:server

# Build for production
npm run build

# Run production
npm start
```

## API Endpoints

### Beers
```
GET    /api/beers              # Get all beers
GET    /api/beers/:id          # Get beer by ID
GET    /api/beers/category/:cat # Get beers by category
```

### Market
```
POST   /api/market/buy         # Buy beer { beerId, quantity }
POST   /api/market/reset       # Reset market
GET    /api/market/total       # Get total market price
GET    /api/market/chart-data  # Get chart data
```

### Transactions
```
GET    /api/transactions       # Get all transactions
GET    /api/transactions/count # Get transaction count
```

## WebSocket Events

### Client -> Server
```typescript
socket.emit('buy', { beerId: number, quantity: number })
socket.emit('reset')
```

### Server -> Client
```typescript
socket.on('pricesUpdated', (beers: Beer[]) => {})
socket.on('purchaseResult', (result: PurchaseResult) => {})
socket.on('marketReset', () => {})
```

## Data Types

```typescript
interface Beer {
  id: number;
  name: string;
  basePrice: number;
  currentPrice: number;
  category: string;
  volatility: number;
}

interface Transaction {
  id: number;
  beerId: number;
  quantity: number;
  timestamp: string;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseResult {
  beer: Beer;
  impact: PurchaseImpact;
}

interface PurchaseImpact {
  purchasedBeerName: string;
  quantity: number;
  sectorChanges: Record<string, number>;
  beerChanges: Record<string, Record<string, number>>;
}

interface ChartData {
  timeLabels: string[];
  sectorPriceHistory: Record<string, number[]>;
  beerPriceHistory: Record<number, number[]>;
  transactionCount: number;
}
```

## Pricing Algorithm

### Core Mechanics (same as JavaFX version)
1. **Zero-Sum Market** - Total market value stays constant
2. **Sector Correlation** - Same-sector beers move together
3. **Mean Reversion** - Prices naturally drift back to base
4. **Decreasing Volatility** - Expensive beers become more stable

### Formulas

**Price Increase (purchased beer):**
```
increase = baseMove × effectiveVolatility × currentPrice × √quantity
```

**Effective Volatility:**
```
effectiveVol = volatility × (1 - 0.3 × log(currentPrice / basePrice))
```

**Mean Reversion:**
```
correction = (basePrice - currentPrice) × 0.01
```

**Sector Correlation:**
```
correlatedIncrease = purchasedIncrease × 0.45 × (beer.volatility / purchased.volatility)
```

### Sector Correlation Matrix

| Bought ↓    | abbey | trappist | specialty |
|-------------|-------|----------|-----------|
| **pils**    | 0.8   | 0.5      | 0.3       |
| **abbey**   | -     | 0.9      | 0.4       |
| **trappist**| 0.9   | -        | 0.5       |
| **specialty**| 0.5  | 0.5      | -         |

### Beer Sectors & Volatility

| Sector    | Beers                              | Volatility  |
|-----------|------------------------------------|-------------|
| pils      | Jupiler, Stella, Maes              | 0.22-0.25   |
| abbey     | Leffe, Grimbergen, Affligem        | 0.32-0.38   |
| trappist  | Chimay, Orval, Westmalle, Rochefort| 0.45-0.55   |
| specialty | Duvel, Delirium, Kwak, Chouffe     | 0.40-0.50   |

## Settings (from database)

| Key                 | Default | Description              |
|---------------------|---------|--------------------------|
| base_move           | 0.45    | Base movement multiplier |
| sector_correlation  | 0.45    | Same-sector correlation  |
| cross_sector_impact | 0.5     | Impact on other sectors  |
| min_price           | 0.50    | Price floor              |
| max_price           | 25.00   | Price ceiling            |

## UI Components

### Main View
- Beer table with columns: Category, Name, Base Price, Current Price, Change%, Quantity, Buy
- Price chart (toggle between sector view and individual beer view)
- Stats: Total market price, Transaction count
- Buttons: History, Reset, Theme toggle

### Chart View
- Full price history chart
- Beer filter checkboxes
- Back button

### History View
- Transaction table: ID, Beer, Quantity, Unit Price, Total, Timestamp
- Transaction count
- Back button

## Theme Support

```typescript
// Dark theme colors
const darkTheme = {
  background: '#1f2940',
  header: '#16213e',
  text: '#ffffff',
  secondaryText: '#a0aec0',
  accent: '#e94560',
};

// Light theme colors
const lightTheme = {
  background: '#ffffff',
  header: '#f5f7fa',
  text: '#1a1a2e',
  secondaryText: '#4a5568',
  accent: '#e94560',
};
```

## Development Roadmap

### Phase 1: Project Setup
- [ ] Initialize npm workspace
- [ ] Setup Vite + React + TypeScript client
- [ ] Setup Express + TypeScript server
- [ ] Configure TailwindCSS
- [ ] Setup SQLite database

### Phase 2: Backend Core
- [ ] Port PricingService from Java
- [ ] Implement repositories (Beer, Transaction, PriceHistory, Settings)
- [ ] Implement MarketService
- [ ] Create REST API routes
- [ ] Add Socket.io for real-time updates

### Phase 3: Frontend Core
- [ ] Create Beer table component
- [ ] Implement buy functionality
- [ ] Add price chart with Recharts
- [ ] Implement theme toggle

### Phase 4: Features
- [ ] Transaction history view
- [ ] Chart filters
- [ ] Impact dialog
- [ ] Market reset

### Phase 5: Polish
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Animations

## Design Principles

1. **KISS** - Keep It Simple, Stupid
2. **DRY** - Don't Repeat Yourself
3. **SOLID** - Single Responsibility, Interface Segregation
4. **SLC** - Simple, Lovable, Complete

## Migration Notes from JavaFX

### Components Mapping
| JavaFX                | React                          |
|-----------------------|--------------------------------|
| MainController        | App.tsx + hooks                |
| MainViewModel         | useMarket hook                 |
| BeerTable (TableView) | BeerTable component            |
| LineChart             | Recharts LineChart             |
| DialogManager         | Modal component                |
| ThemeService          | useTheme hook + Tailwind       |

### Key Differences
- State management: JavaFX Properties → React useState/useReducer
- Data binding: JavaFX bindings → React Query + state
- Styling: CSS → TailwindCSS
- Navigation: Scene switching → React Router (optional, can use state)
