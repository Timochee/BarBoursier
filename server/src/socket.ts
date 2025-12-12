import { Server as SocketIOServer } from 'socket.io';
import type { Beer } from 'shared';

let io: SocketIOServer | null = null;

export function setSocketIO(socketIO: SocketIOServer): void {
  io = socketIO;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Emit beers updated event - caller provides the beers to avoid circular dependency
export function emitBeersUpdated(beers: Beer[]): void {
  if (io) {
    io.emit('beersUpdated', beers);
  }
}
