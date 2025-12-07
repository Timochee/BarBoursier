import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase, closeDatabase } from './db/connection';
import apiRoutes from './routes';
import authRoutes from './routes/auth';
import { marketService, chartDataService } from './services';
import { setSocketIO } from './socket';
import { configurePassport } from './middleware/auth';
import type { BuyRequest } from 'shared';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize database
initializeDatabase();
chartDataService.initializeHistory();

// Configure Passport for Google OAuth
configurePassport();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST'],
  },
});

// Make io available globally for beer updates
setSocketIO(io);

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
}));
app.use(express.json());
app.use(passport.initialize());

// API routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data
  const beers = marketService.getAllBeers();
  socket.emit('pricesUpdated', beers);

  // Handle buy event
  socket.on('buy', (data: BuyRequest) => {
    const result = marketService.buy(data.beerId, data.quantity);

    if (result) {
      // Broadcast updated prices to all clients
      const updatedBeers = marketService.getAllBeers();
      io.emit('pricesUpdated', updatedBeers);
      socket.emit('purchaseResult', result);
    }
  });

  // Handle reset event
  socket.on('reset', () => {
    const beers = marketService.reset();
    io.emit('marketReset');
    io.emit('pricesUpdated', beers);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server on all interfaces
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  closeDatabase();
  process.exit(0);
});
