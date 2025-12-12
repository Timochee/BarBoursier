import { useState, useCallback } from 'react';

// Hook for managing object-based form state with reset capability
export function useFormState<T extends object>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  const reset = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    state,
    setState,
    reset,
    setField,
  };
}

// Hook for managing async actions with loading state
export function useAsyncAction() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const execute = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: unknown) => void;
      onFinally?: () => void;
    }
  ): Promise<T | undefined> => {
    setIsSubmitting(true);
    try {
      const result = await action();
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      options?.onError?.(error);
      return undefined;
    } finally {
      setIsSubmitting(false);
      options?.onFinally?.();
    }
  }, []);

  return { isSubmitting, execute };
}
