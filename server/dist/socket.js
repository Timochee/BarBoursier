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
// Emit beers updated event - caller provides the beers to avoid circular dependency
function emitBeersUpdated(beers) {
    if (io) {
        io.emit('beersUpdated', beers);
    }
}
