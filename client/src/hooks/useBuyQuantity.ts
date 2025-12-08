import { useState, useRef, useCallback } from 'react';
import { BUY_COOLDOWN_MS } from 'shared';

interface UseBuyQuantityOptions {
  onBuy: (beerId: number, quantity: number) => void;
  keepQuantity?: boolean;
}

export function useBuyQuantity({ onBuy, keepQuantity = false }: UseBuyQuantityOptions) {
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [processingBeer, setProcessingBeer] = useState<number | null>(null);
  const lastBuyTime = useRef<number>(0);

  const getQuantity = useCallback((beerId: number) => {
    return quantities[beerId] || 1;
  }, [quantities]);

  const setQuantity = useCallback((beerId: number, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty >= 1) {
      setQuantities(prev => ({ ...prev, [beerId]: qty }));
    }
  }, []);

  const handleBuy = useCallback((beerId: number) => {
    const now = Date.now();

    // Cooldown check
    if (now - lastBuyTime.current < BUY_COOLDOWN_MS) return;

    // Already processing check
    if (processingBeer !== null) return;

    lastBuyTime.current = now;
    setProcessingBeer(beerId);

    const quantity = quantities[beerId] || 1;
    onBuy(beerId, quantity);

    // Reset quantity if not keeping
    if (!keepQuantity) {
      setQuantities(prev => ({ ...prev, [beerId]: 1 }));
    }

    // Clear processing state after cooldown
    setTimeout(() => {
      setProcessingBeer(null);
    }, BUY_COOLDOWN_MS);
  }, [quantities, processingBeer, onBuy, keepQuantity]);

  const isProcessing = useCallback((beerId: number) => {
    return processingBeer === beerId;
  }, [processingBeer]);

  const isDisabled = processingBeer !== null;

  return {
    getQuantity,
    setQuantity,
    handleBuy,
    isProcessing,
    isDisabled,
  };
}
