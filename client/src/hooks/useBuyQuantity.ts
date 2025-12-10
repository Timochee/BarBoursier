import { useState, useRef, useCallback } from 'react';
import { BUY_COOLDOWN_MS } from 'shared';

interface UseBuyQuantityOptions {
  onBuy: (beerId: number, quantity: number) => void;
  keepQuantity?: boolean;
}

export function useBuyQuantity({ onBuy, keepQuantity = false }: UseBuyQuantityOptions) {
  // Store as strings to allow empty input while typing
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [processingBeer, setProcessingBeer] = useState<number | null>(null);
  const lastBuyTime = useRef<number>(0);

  const getQuantity = useCallback((beerId: number): string => {
    return quantities[beerId] ?? '1';
  }, [quantities]);

  const getQuantityNumber = useCallback((beerId: number): number => {
    const val = quantities[beerId];
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }, [quantities]);

  const setQuantity = useCallback((beerId: number, value: string) => {
    // Allow empty string or valid positive numbers
    if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 0)) {
      setQuantities(prev => ({ ...prev, [beerId]: value }));
    }
  }, []);

  // Reset to 1 if empty when leaving the field
  const handleBlur = useCallback((beerId: number) => {
    const val = quantities[beerId];
    if (val === '' || val === '0') {
      setQuantities(prev => ({ ...prev, [beerId]: '1' }));
    }
  }, [quantities]);

  const handleBuy = useCallback((beerId: number) => {
    const now = Date.now();

    // Cooldown check
    if (now - lastBuyTime.current < BUY_COOLDOWN_MS) return;

    // Already processing check
    if (processingBeer !== null) return;

    lastBuyTime.current = now;
    setProcessingBeer(beerId);

    const quantity = getQuantityNumber(beerId);
    onBuy(beerId, quantity);

    // Reset quantity if not keeping
    if (!keepQuantity) {
      setQuantities(prev => ({ ...prev, [beerId]: '1' }));
    }

    // Clear processing state after cooldown
    setTimeout(() => {
      setProcessingBeer(null);
    }, BUY_COOLDOWN_MS);
  }, [getQuantityNumber, processingBeer, onBuy, keepQuantity]);

  const isProcessing = useCallback((beerId: number) => {
    return processingBeer === beerId;
  }, [processingBeer]);

  const isDisabled = processingBeer !== null;

  return {
    getQuantity,
    setQuantity,
    handleBlur,
    handleBuy,
    isProcessing,
    isDisabled,
  };
}
