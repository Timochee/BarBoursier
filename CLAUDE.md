# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bar Boursier is a web-based stock market bar application where beer prices fluctuate based on purchases. The market is **zero-sum**: when some beers go up, others must go down by the same total amount.

## Commands

```bash
npm install          # Install all dependencies
npm run dev          # Development (both client and server)
npm run dev:client   # Client only (port 5173)
npm run dev:server   # Server only (port 3001, copies .env.development to .env)
npm run build        # Build all workspaces (shared → server → client)
npm start            # Run production server
```

### Docker
```bash
docker compose build                    # Build image
docker compose up -d                    # Start with Caddy reverse proxy
docker compose logs -f barboursier      # View app logs
```
Requires `server/.env.production` file. Uses Caddy for HTTPS/reverse proxy.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, Recharts, React Query, Socket.io-client
- **Backend**: Node.js + Express + TypeScript, better-sqlite3, Socket.io, Passport.js (Google OAuth), JWT

## Architecture

Monorepo structure with client/server separation and shared types:

```
barboursier/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API and Socket.io clients
│       └── utils/          # Shared utilities (colors, styles)
├── server/                 # Express backend
│   └── src/
│       ├── db/             # Database connection and migrations
│       ├── middleware/     # Auth middleware (JWT, Google OAuth)
│       ├── repositories/   # Data access layer
│       ├── routes/         # Express route handlers
│       ├── services/       # Business logic
│       └── socket/         # Socket.io handlers
└── shared/                 # Shared types and constants
    └── src/
        └── index.ts        # Types, constants, pricing config
```

### Shared Package (`shared/`)
All types, constants, and pricing configuration are centralized:
- **Types**: Beer, Transaction, PurchaseResult, ChartData, MarketStats, Settings
- **Constants**: CATEGORIES, BUY_COOLDOWN_MS, DEFAULT_SETTINGS
- **Pricing Config**: SECTOR_MATRIX, SECTOR_REVERSION_MULTIPLIERS, MEAN_REVERSION_BASE_STRENGTH

### Backend Services
- **PricingService** - Core pricing algorithm (zero-sum, sector correlation, mean reversion)
- **MarketService** - Market operations (buy, reset)
- **ChartDataService** - Price history for charts

### Backend Repositories
- **BeerRepository** - Beer CRUD operations
- **TransactionRepository** - Transaction storage (uses SQL template extraction)
- **PriceHistoryRepository** - Price snapshots for charts
- **SettingsRepository** - Dynamic settings storage

### Backend Middleware (`middleware/auth.ts`)
- **configurePassport()** - Sets up Google OAuth strategy
- **authMiddleware** - Validates JWT, allows any authenticated user
- **adminMiddleware** - Validates JWT, requires admin role (email in whitelist)
- **generateToken(user)** - Creates JWT with user info and role
- **isEmailAllowed(email)** - Checks if email is in ADMIN_EMAILS whitelist
- **isOAuthConfigured()** - Checks if Google OAuth credentials are set

### Frontend Components
- **BeerTable** - Main table with sorting, category filtering, buy actions (buy hidden for guests)
- **PriceChart** - Recharts line chart (by sector or by beer view)
- **BeerManagement** - Modal container for beer CRUD (admin only)
  - **BeerForm** - Add/edit beer form
  - **BeerListItem** - Individual beer row in manage list
- **TransactionHistory** - Modal showing purchase history (admin only)
- **ImpactDialog** - Shows price impact after purchase
- **ConfirmDialog** - Reusable confirmation modal
- **Toast/ToastContainer** - Toast notification system
- **Tooltip** - Hover tooltips for UI elements
- **Skeleton** - Loading skeletons (table, chart, stats)

### Frontend Hooks
- **useMarket** - Market state management via Socket.io (beers, stats, chart data, buy, reset)
- **useAdminMode** - Authentication state (isLoggedIn, isAdmin, user, login, logout)
- **useBeerSort** - Beer sorting and filtering logic (extracted from BeerTable)
- **useToast** - Toast notifications (success, error, warning, info)
- **useTheme** - Dark/light theme support
- **useTransactions** - Fetch transaction history

### Frontend Utilities
- **utils/colors.ts** - Beer color mapping for charts
- **utils/styles.ts** - Centralized category styles and default volatility values

### Frontend Services (`services/api.ts`)
- **Token management**: getToken(), setToken(), removeToken()
- **handleAuthCallback()** - Handles OAuth redirect, extracts token from URL
- **getGoogleAuthUrl()** - Returns Google OAuth initiation URL
- **api.verify()** - Verifies JWT token, returns { valid, isAdmin, user }
- **api.logout()** - Logout endpoint

## Authentication & Authorization

### User Roles
| Role | Description | Capabilities |
|------|-------------|--------------|
| Guest | Not logged in | View prices, view chart |
| Admin | Email in admins table | Buy, reset, manage beers, view history |
| Superadmin | Email matches SUPERADMIN_EMAIL | All admin + manage other admins |

### Auth Flow
1. User clicks "Login" → redirects to Google OAuth
2. Google authenticates → redirects to `/api/auth/google/callback`
3. Server validates, generates JWT with `{ email, name, picture }`
4. Client stores JWT in localStorage
5. All API requests include `Authorization: Bearer <token>`
6. Server validates JWT and checks role from DB (admins table) or env (superadmin)

### Role Hierarchy
- **Superadmin**: Defined in `.env` via `SUPERADMIN_EMAIL`
- **Admin**: Stored in SQLite `admins` table, managed by superadmin via UI
- **Guest**: Any other logged-in user

### Environment Variables
```env
GOOGLE_CLIENT_ID=...           # From Google Cloud Console
GOOGLE_CLIENT_SECRET=...       # From Google Cloud Console
SUPERADMIN_EMAIL=you@email.com # Single superadmin email
JWT_SECRET=...                 # Secret for signing JWTs
PORT=3001                      # Server port
CLIENT_URL=http://localhost:5173  # For OAuth redirect
LOG_LEVEL=info                 # Pino log level (debug, info, warn, error)
```
Server reads from `.env.development` (dev) or `.env.production` (Docker).

## UI/UX Features

### Header Actions (left to right, admin only except last two)
1. **Beers** - Open beer management modal
2. **History** - Open transaction history
3. **Keep Qty** - Toggle: keep quantity after purchase (amber when active)
4. **Impact** - Toggle: show impact dialog after purchase (green when active)
5. **Reset** - Reset market (red, with confirmation dialog)
6. **Live/Offline** - Connection status indicator (always visible)
7. **User/Login** - Shows user photo+name if logged in, or Google login button
8. **Theme toggle** - Dark/light mode switch (always visible)

### Beer Market Section
- **Search input** - Filter beers by name or category
- **Category filter badges** - Click to filter table by category (Clear button appears on left)
- **Sortable columns** - Category, Name, Base price, Current price, Change %
- **Category badges** - Only shown for first beer in consecutive category group
- **Quantity input** - Per-beer quantity selector (admin only)
- **Buy button** - With loading spinner and cooldown (admin only)

### Price Chart
- **View modes** - By Sector / By Beer toggle
- **Beer selection** - Show/hide individual beers (in beer mode)
- **Timestamps** - X-axis shows transaction times

### Styling
- CSS variables for theming: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`, `--text-secondary`, `--border-color`, `--row-hover`
- Badge styles: `badge-pils`, `badge-abbey`, `badge-trappist`, `badge-specialty`
- Price indicators: `price-up` (green), `price-down` (red), `price-neutral`

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
| Setting              | Value  | Source      |
|----------------------|--------|-------------|
| baseMove             | 0.45   | settings DB |
| sectorCorrelation    | 0.45   | settings DB |
| minPrice             | 0.50€  | settings DB |
| maxPrice             | 25.00€ | settings DB |
| MEAN_REVERSION       | 0.01   | shared/     |
| MAX_DECREASE_RATIO   | 10%    | shared/     |
| BUY_COOLDOWN_MS      | 300    | shared/     |
| volatility.min/max   | 0.1-1.0| shared/     |

### Beer Sectors & Volatility
| Sector    | Beers                               | Volatility |
|-----------|-------------------------------------|------------|
| pils      | Jupiler, Stella, Maes               | 0.22-0.25  |
| abbey     | Leffe, Grimbergen, Affligem         | 0.32-0.38  |
| trappist  | Chimay, Orval, Westmalle, Rochefort | 0.45-0.55  |
| specialty | Duvel, Delirium, Kwak, Chouffe      | 0.40-0.50  |

## API Structure

### Health
- `GET /health` - Health check endpoint (used by Docker healthcheck)

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback (redirects to client with token)
- `GET /api/auth/verify` - Verify JWT token, returns `{ valid, isAdmin, user }`
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /api/auth/status` - Check if OAuth is configured

### Beers
- `GET /api/beers` - All beers
- `GET /api/beers/:id` - Single beer
- `GET /api/beers/category/:category` - Beers by category
- `GET /api/beers/categories` - List of categories
- `POST /api/beers` - Create beer (Admin) `{ name, basePrice, category, volatility }`
- `PUT /api/beers/:id` - Update beer (Admin)
- `DELETE /api/beers/:id` - Delete beer (Admin)

### Market
- `POST /api/market/buy` - Buy beer (Admin) `{ beerId, quantity }`
- `POST /api/market/reset` - Reset market (Admin)
- `GET /api/market/total` - Market stats
- `GET /api/market/chart-data` - Chart data

### Transactions
- `GET /api/transactions` - Transaction history (optional `?limit=N`)
- `GET /api/transactions/count` - Transaction count

### Admins
- `GET /api/admins` - List all admins (Superadmin)
- `POST /api/admins` - Add admin (Superadmin) `{ email, name }`
- `DELETE /api/admins/:id` - Remove admin (Superadmin, or admin removing self)

## WebSocket Events

### Client → Server
- `buy` - `{ beerId, quantity }`
- `reset` - Reset market

### Server → Client
- `pricesUpdated` - Beer array with new prices
- `beersUpdated` - Beer list changed (add/edit/delete)
- `purchaseResult` - Purchase result with impact data
- `marketReset` - Market was reset

## Development Best Practices

### Code Principles
| Principle | Description |
|-----------|-------------|
| **KISS** | Keep It Simple, Stupid |
| **DRY** | Don't Repeat Yourself |
| **SLC** | Simple, Lovable, Complete |
| **1 class 1 purpose** | Each class has a single responsibility |

### SOLID Principles
- **S**ingle Responsibility: A class should have only one reason to change
- **O**pen-Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subclasses must be substitutable for their base classes
- **I**nterface Segregation: Break large interfaces into smaller, specific ones
- **D**ependency Inversion: Depend on abstractions, not concretions

### Docker Best Practices
| Acronym | Meaning | Description |
|---------|---------|-------------|
| **SLIM** | Small, Lean, Independent, Minimal | Use minimal base images (Alpine), install only runtime dependencies |
| **DRI** | Don't Run as root | Always use `USER app` |
| **BLoC** | Build Once, Launch Constantly | Same artifact for all environments |
| **CLEAN** | Clean Layers | Group commands, remove caches in same layer |
| **IMMUTABLE** | Immutable Containers | No runtime changes, rebuild for any change |
| **CONFIG OUT** | Configuration Outside | Never bake secrets into images |
| **1C1P** | One Container, One Process | Easier to monitor, scale, maintain |
| **CACHED** | Cache-Friendly Builds | Order Dockerfile for layer caching |
| **HEALTH** | Health Checks | Add healthcheck endpoints |
| **TAG SMART** | Meaningful Tags | Never use "latest", use semantic versions |
| **LOG TO STDOUT** | Standard Output | Log to stdout/stderr, not files |
| **SECURE BY DEFAULT** | Security First | Drop capabilities, scan images, update deps |
