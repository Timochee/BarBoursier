"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const connection_1 = require("./db/connection");
const routes_1 = __importDefault(require("./routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const services_1 = require("./services");
const socket_1 = require("./socket");
const auth_2 = require("./middleware/auth");
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
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
        origin: [CLIENT_URL, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});
// Make io available globally for beer updates
(0, socket_1.setSocketIO)(io);
// Middleware
app.use((0, cors_1.default)({
    origin: [CLIENT_URL, 'http://localhost:3000'],
}));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
// API routes
app.use('/api', routes_1.default);
app.use('/api/auth', auth_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Socket.io events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Send initial data
    const beers = services_1.marketService.getAllBeers();
    socket.emit('pricesUpdated', beers);
    // Handle buy event
    socket.on('buy', (data) => {
        const result = services_1.marketService.buy(data.beerId, data.quantity);
        if (result) {
            // Broadcast updated prices to all clients
            const updatedBeers = services_1.marketService.getAllBeers();
            io.emit('pricesUpdated', updatedBeers);
            socket.emit('purchaseResult', result);
        }
    });
    // Handle reset event
    socket.on('reset', () => {
        const beers = services_1.marketService.reset();
        io.emit('marketReset');
        io.emit('pricesUpdated', beers);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    (0, connection_1.closeDatabase)();
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    (0, connection_1.closeDatabase)();
    process.exit(0);
});
