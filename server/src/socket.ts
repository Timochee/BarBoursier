import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function setSocketIO(socketIO: SocketIOServer): void {
  io = socketIO;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitBeersUpdated(): void {
  if (io) {
    // Import here to avoid circular dependency
    const { marketService } = require('./services');
    const beers = marketService.getAllBeers();
    io.emit('beersUpdated', beers);
  }
}
