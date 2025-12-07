# Bar Boursier

A web-based stock market bar application where beer prices fluctuate based on purchases. The market is **zero-sum**: when some beers go up, others must go down by the same total amount.

![Beer Market](https://img.shields.io/badge/Beer-Market-amber)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)

## Features

- **Real-time price updates** via WebSocket
- **Zero-sum market**: price increases are balanced by decreases elsewhere
- **Sector correlations**: beers in the same category move together
- **Mean reversion**: prices drift back to base values over time
- **Google OAuth authentication** with email whitelist for admin access
- **Guest mode**: anyone can view prices and charts
- **Admin mode**: manage beers, make purchases, reset market
- **Dark/Light theme** support
- **Responsive design** for mobile and desktop

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Recharts (price charts)
- React Query
- Socket.io-client

### Backend
- Node.js + Express + TypeScript
- SQLite (better-sqlite3)
- Socket.io
- Passport.js (Google OAuth)
- JWT authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/barboursier.git
cd barboursier

# Install dependencies
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp server/.env.example server/.env
```

2. Configure Google OAuth (optional, for admin features):
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select an existing one
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
   - Copy Client ID and Client Secret to your `.env`

3. Update your `.env` file:
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-secret-key

# Server config
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Running the Application

```bash
# Development (runs both client and server)
npm run dev

# Or run separately:
npm run dev:client   # Frontend only (port 5173)
npm run dev:server   # Backend only (port 3001)
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
barboursier/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── services/       # API client
│   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── db/             # Database setup
│   │   ├── middleware/     # Auth middleware
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   └── ...
├── shared/                 # Shared TypeScript types
└── ...
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/beers` | Get all beers | - |
| POST | `/api/beers` | Create a beer | Admin |
| PUT | `/api/beers/:id` | Update a beer | Admin |
| DELETE | `/api/beers/:id` | Delete a beer | Admin |
| POST | `/api/market/buy` | Buy a beer | Admin |
| POST | `/api/market/reset` | Reset market | Admin |
| GET | `/api/market/chart-data` | Get price history | - |
| GET | `/api/auth/google` | Initiate Google OAuth | - |
| GET | `/api/auth/verify` | Verify JWT token | - |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `pricesUpdated` | Server → Client | Prices have changed |
| `purchaseResult` | Server → Client | Purchase result |
| `marketReset` | Server → Client | Market was reset |

## Pricing Algorithm

The pricing algorithm ensures a **zero-sum market**:

1. **Purchase Impact**: When a beer is bought, its price increases based on quantity and volatility
2. **Sector Correlation**: Beers in the same sector increase proportionally
3. **Redistribution**: Other beers decrease to maintain market equilibrium
4. **Mean Reversion**: All prices slowly drift back to their base values
5. **Crash Protection**: Maximum 10% decrease per transaction, with floor protection near minimum price

### Beer Sectors

| Sector | Beers | Volatility |
|--------|-------|------------|
| Pils | Jupiler, Stella, Maes | Low (0.22-0.25) |
| Abbey | Leffe, Grimbergen, Affligem | Medium (0.32-0.38) |
| Trappist | Chimay, Orval, Westmalle, Rochefort | High (0.45-0.55) |
| Specialty | Duvel, Delirium, Kwak, Chouffe | High (0.40-0.50) |