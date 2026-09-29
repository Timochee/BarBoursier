import type { Server, Socket } from 'socket.io';
import type { BuyRequest } from 'shared';
import { marketService, BUY_ERROR_MESSAGES } from '../services';
import { verifySocketToken, isAdminOrAbove } from '../middleware/auth';
import { logger } from '../logger';

interface AuthenticatedRequest {
  token?: string;
}

// Validates token and returns user if authorized for the required role
function authenticateSocket(
  socket: Socket,
  token: string | undefined,
  requiredRole: 'admin' | 'superadmin'
) {
  if (!token) {
    socket.emit('error', { message: 'Authentication required' });
    return null;
  }

  const user = verifySocketToken(token);
  if (!user) {
    socket.emit('error', { message: 'Invalid token' });
    return null;
  }

  if (requiredRole === 'superadmin' && user.role !== 'superadmin') {
    socket.emit('error', { message: 'Superadmin access required' });
    return null;
  }

  if (requiredRole === 'admin' && !isAdminOrAbove(user.role)) {
    socket.emit('error', { message: 'Admin access required' });
    return null;
  }

  return user;
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    // Send current prices on connect
    const beers = marketService.getAllBeers();
    socket.emit('pricesUpdated', beers);

    // Buy event - requires admin role
    socket.on('buy', (data: BuyRequest & AuthenticatedRequest) => {
      const { token, beerId, quantity } = data;

      const user = authenticateSocket(socket, token, 'admin');
      if (!user) return;

      const outcome = marketService.buy(beerId, quantity);
      if (!outcome.ok) {
        socket.emit('error', { message: BUY_ERROR_MESSAGES[outcome.error] });
        return;
      }

      logger.info({ beerId, quantity, user: user.email }, 'Purchase made');
      io.emit('pricesUpdated', marketService.getAllBeers());
      socket.emit('purchaseResult', outcome.result);
    });

    // Reset event - requires superadmin role
    socket.on('reset', (data?: AuthenticatedRequest) => {
      const user = authenticateSocket(socket, data?.token, 'superadmin');
      if (!user) return;

      logger.info({ user: user.email }, 'Market reset');
      const resetBeers = marketService.reset();
      io.emit('marketReset');
      io.emit('pricesUpdated', resetBeers);
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });
}
