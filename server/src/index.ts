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
import {chartDataService} from './services';
import {setSocketIO} from './socket';
import {registerSocketHandlers} from './socket/handlers';
import {configurePassport} from './middleware/auth';
import {logger} from './logger';

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

// Trust proxy for rate limiting behind reverse proxy (Render, Caddy, etc.)
if (isProduction) {
    app.set('trust proxy', 1);
}

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
    contentSecurityPolicy: isProduction ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
            connectSrc: ["'self'", "wss:", "ws:"],
        },
    } : false, // Disable CSP in dev for hot reload
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
registerSocketHandlers(io);

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
