import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import type { Beer, PurchaseResult, MarketStats, ChartData } from 'shared';

type MarketEventHandlers = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
};

export function useMarket(handlers?: MarketEventHandlers) {
  const queryClient = useQueryClient();
  const [beers, setBeers] = useState<Beer[]>([]);
  const [stats, setStats] = useState<MarketStats>({ totalMarketPrice: 0, transactionCount: 0 });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [lastPurchase, setLastPurchase] = useState<PurchaseResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const refreshStats = useCallback(async () => {
    const newStats = await api.getStats();
    setStats(newStats);
  }, []);

  const refreshChartData = useCallback(async () => {
    const data = await api.getChartData();
    setChartData(data);
  }, []);

  useEffect(() => {
    // Connect to socket
    socketService.connect({
      onPricesUpdated: (updatedBeers) => {
        setBeers(updatedBeers);
        refreshStats();
        refreshChartData();
      },
      onBeersUpdated: (updatedBeers) => {
        // Beer list changed (add/remove/update)
        setBeers(updatedBeers);
        refreshStats();
      },
      onPurchaseResult: (result) => {
        setLastPurchase(result);
      },
      onMarketReset: () => {
        setLastPurchase(null);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        refreshStats();
        refreshChartData();
      },
      onConnect: () => {
        setIsConnected(true);
        handlersRef.current?.onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        handlersRef.current?.onDisconnect?.();
      },
      onError: (error) => {
        handlersRef.current?.onError?.(error);
      },
    });

    // Load initial data
    const loadInitialData = async () => {
      try {
        const [beersData] = await Promise.all([
          api.getBeers(),
          refreshStats(),
          refreshChartData(),
        ]);
        setBeers(beersData);
      } catch (error) {
        handlersRef.current?.onError?.('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [queryClient, refreshStats, refreshChartData]);

  const buy = useCallback((beerId: number, quantity: number) => {
    socketService.buy({ beerId, quantity });
  }, []);

  const reset = useCallback(() => {
    socketService.reset();
  }, []);

  const clearLastPurchase = useCallback(() => {
    setLastPurchase(null);
  }, []);

  return {
    beers,
    stats,
    chartData,
    lastPurchase,
    isConnected,
    isLoading,
    buy,
    reset,
    clearLastPurchase,
  };
}
