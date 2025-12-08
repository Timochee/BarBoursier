"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const connection_1 = require("./db/connection");
const routes_1 = __importDefault(require("./routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const services_1 = require("./services");
const socket_1 = require("./socket");
const auth_2 = require("./middleware/auth");
const logger_1 = require("./logger");
const PORT = process.env.PORT || 3001;
// Initialize database
(0, connection_1.initializeDatabase)();
services_1.chartDataService.initializeHistory();
// Configure Passport for Google OAuth
(0, auth_2.configurePassport)();
// Create Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.io setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        methods: ['GET', 'POST'],
    },
});
(0, socket_1.setSocketIO)(io);
// Middleware
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
// API routes
app.use('/api', routes_1.default);
app.use('/api/auth', auth_1.default);
// Health check with DB verification
app.get('/health', (req, res) => {
    try {
        connection_1.db.prepare('SELECT 1').get();
        res.json({ status: 'ok', db: 'connected' });
    }
    catch {
        res.status(503).json({ status: 'error', db: 'disconnected' });
    }
});
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientDistPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
            res.sendFile(path_1.default.join(clientDistPath, 'index.html'));
        }
    });
}
// Socket.io events
io.on('connection', (socket) => {
    logger_1.logger.info({ socketId: socket.id }, 'Client connected');
    const beers = services_1.marketService.getAllBeers();
    socket.emit('pricesUpdated', beers);
    socket.on('buy', (data) => {
        const result = services_1.marketService.buy(data.beerId, data.quantity);
        if (result) {
            logger_1.logger.info({ beerId: data.beerId, quantity: data.quantity }, 'Purchase made');
            io.emit('pricesUpdated', services_1.marketService.getAllBeers());
            socket.emit('purchaseResult', result);
        }
    });
    socket.on('reset', () => {
        logger_1.logger.info('Market reset');
        const beers = services_1.marketService.reset();
        io.emit('marketReset');
        io.emit('pricesUpdated', beers);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info({ socketId: socket.id }, 'Client disconnected');
    });
});
// Start server
const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
httpServer.listen(port, '0.0.0.0', () => {
    logger_1.logger.info({ port }, 'Server started');
});
// Graceful shutdown
const shutdown = () => {
    logger_1.logger.info('Shutting down...');
    (0, connection_1.closeDatabase)();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
