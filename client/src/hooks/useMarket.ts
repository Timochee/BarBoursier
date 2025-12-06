import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import type { Beer, PurchaseResult, MarketStats, ChartData } from '../types';

export function useMarket() {
  const queryClient = useQueryClient();
  const [beers, setBeers] = useState<Beer[]>([]);
  const [stats, setStats] = useState<MarketStats>({ totalMarketPrice: 0, transactionCount: 0 });
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [lastPurchase, setLastPurchase] = useState<PurchaseResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
      onPurchaseResult: (result) => {
        setLastPurchase(result);
      },
      onMarketReset: () => {
        setLastPurchase(null);
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        refreshStats();
        refreshChartData();
      },
    });

    setIsConnected(true);

    // Load initial data
    api.getBeers().then(setBeers);
    refreshStats();
    refreshChartData();

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
    buy,
    reset,
    clearLastPurchase,
  };
}
