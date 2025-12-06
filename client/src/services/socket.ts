import { io, Socket } from 'socket.io-client';
import type { Beer, PurchaseResult, BuyRequest } from '../types';

type SocketEventHandlers = {
  onPricesUpdated?: (beers: Beer[]) => void;
  onPurchaseResult?: (result: PurchaseResult) => void;
  onMarketReset?: () => void;
};

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketEventHandlers = {};

  connect(handlers: SocketEventHandlers): void {
    if (this.socket?.connected) {
      return;
    }

    this.handlers = handlers;
    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('pricesUpdated', (beers: Beer[]) => {
      this.handlers.onPricesUpdated?.(beers);
    });

    this.socket.on('purchaseResult', (result: PurchaseResult) => {
      this.handlers.onPurchaseResult?.(result);
    });

    this.socket.on('marketReset', () => {
      this.handlers.onMarketReset?.();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  buy(request: BuyRequest): void {
    this.socket?.emit('buy', request);
  }

  reset(): void {
    this.socket?.emit('reset');
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
