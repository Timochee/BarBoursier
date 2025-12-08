import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {initializeDatabase, closeDatabase, db} from './db/connection';
import apiRoutes from './routes';
import authRoutes from './routes/auth';
import {marketService, chartDataService} from './services';
import {setSocketIO} from './socket';
import {configurePassport} from './middleware/auth';
import {logger} from './logger';
import type {BuyRequest} from 'shared';

const PORT = process.env.PORT || 3001;

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
        origin: true,
        methods: ['GET', 'POST'],
    },
});

setSocketIO(io);

// Middleware
app.use(cors({origin: true}));
app.use(express.json());
app.use(passport.initialize());

// API routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);

// Health check with DB verification
app.get('/health', (req, res) => {
    try {
        db.prepare('SELECT 1').get();
        res.json({status: 'ok', db: 'connected'});
    } catch {
        res.status(503).json({status: 'error', db: 'disconnected'});
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        }
    });
}

// Socket.io events
io.on('connection', (socket) => {
    logger.info({socketId: socket.id}, 'Client connected');

    const beers = marketService.getAllBeers();
    socket.emit('pricesUpdated', beers);

    socket.on('buy', (data: BuyRequest) => {
        const result = marketService.buy(data.beerId, data.quantity);
        if (result) {
            logger.info({beerId: data.beerId, quantity: data.quantity}, 'Purchase made');
            io.emit('pricesUpdated', marketService.getAllBeers());
            socket.emit('purchaseResult', result);
        }
    });

    socket.on('reset', () => {
        logger.info('Market reset');
        const beers = marketService.reset();
        io.emit('marketReset');
        io.emit('pricesUpdated', beers);
    });

    socket.on('disconnect', () => {
        logger.info({socketId: socket.id}, 'Client disconnected');
    });
});

// Start server
const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
httpServer.listen(port, '0.0.0.0', () => {
    logger.info({port}, 'Server started');
});

// Graceful shutdown
const shutdown = () => {
    logger.info('Shutting down...');
    closeDatabase();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
