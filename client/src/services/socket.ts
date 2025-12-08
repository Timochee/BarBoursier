import { io, Socket } from 'socket.io-client';
import type { Beer, PurchaseResult, BuyRequest } from 'shared';
import { getToken } from './api';

type SocketEventHandlers = {
  onPricesUpdated?: (beers: Beer[]) => void;
  onBeersUpdated?: (beers: Beer[]) => void;
  onPurchaseResult?: (result: PurchaseResult) => void;
  onMarketReset?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
};

class SocketService {
  private socket: Socket | null = null;
  private handlers: SocketEventHandlers = {};

  connect(handlers: SocketEventHandlers): void {
    if (this.socket?.connected) {
      return;
    }

    this.handlers = handlers;
    // In production, connect to same origin. In dev, Vite proxies to localhost:3001
    this.socket = io({
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', () => {
      this.handlers.onError?.('Connection failed. Retrying...');
    });

    this.socket.on('error', (error) => {
      this.handlers.onError?.(error.message || 'An error occurred');
    });

    this.socket.on('pricesUpdated', (beers: Beer[]) => {
      this.handlers.onPricesUpdated?.(beers);
    });

    this.socket.on('beersUpdated', (beers: Beer[]) => {
      this.handlers.onBeersUpdated?.(beers);
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
    const token = getToken();
    this.socket?.emit('buy', { ...request, token });
  }

  reset(): void {
    const token = getToken();
    this.socket?.emit('reset', { token });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
