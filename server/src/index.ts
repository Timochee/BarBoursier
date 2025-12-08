import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import path from 'path';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {initializeDatabase, closeDatabase, db} from './db/connection';
import apiRoutes from './routes';
import authRoutes from './routes/auth';
import {marketService, chartDataService} from './services';
import {setSocketIO} from './socket';
import {configurePassport, verifySocketToken, isAdminOrAbove} from './middleware/auth';
import {logger} from './logger';
import type {BuyRequest} from 'shared';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

// Initialize database
initializeDatabase();
chartDataService.initializeHistory();

// Configure Passport for Google OAuth
configurePassport();

// Create Express app
const app = express();
const httpServer = createServer(app);

// CORS configuration - restrict to CLIENT_URL in production
const corsOptions = {
    origin: isProduction ? CLIENT_URL : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
};

// Socket.io setup
const io = new Server(httpServer, {
    cors: corsOptions,
});

setSocketIO(io);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in dev for hot reload
}));

// Rate limiting - 100 requests per minute per IP
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Middleware
app.use(cors(corsOptions));
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

    // Authenticated buy event - requires admin role
    socket.on('buy', (data: BuyRequest & { token?: string }) => {
        const { token, beerId, quantity } = data;

        if (!token) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const user = verifySocketToken(token);
        if (!user || !isAdminOrAbove(user.role)) {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }

        const result = marketService.buy(beerId, quantity);
        if (result) {
            logger.info({beerId, quantity, user: user.email}, 'Purchase made');
            io.emit('pricesUpdated', marketService.getAllBeers());
            socket.emit('purchaseResult', result);
        }
    });

    // Authenticated reset event - requires admin role
    socket.on('reset', (data?: { token?: string }) => {
        const token = data?.token;

        if (!token) {
            socket.emit('error', { message: 'Authentication required' });
            return;
        }

        const user = verifySocketToken(token);
        if (!user || !isAdminOrAbove(user.role)) {
            socket.emit('error', { message: 'Admin access required' });
            return;
        }

        logger.info({user: user.email}, 'Market reset');
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
