"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = setSocketIO;
exports.getSocketIO = getSocketIO;
exports.emitBeersUpdated = emitBeersUpdated;
let io = null;
function setSocketIO(socketIO) {
    io = socketIO;
}
function getSocketIO() {
    return io;
}
function emitBeersUpdated() {
    if (io) {
        // Import here to avoid circular dependency
        const { marketService } = require('./services');
        const beers = marketService.getAllBeers();
        io.emit('beersUpdated', beers);
    }
}
