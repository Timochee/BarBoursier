import { useState, useCallback } from 'react';

// Hook to handle two-step delete confirmation pattern
// First click requests confirmation, second click confirms
export function useDeleteConfirmation<T extends string | number>() {
  const [confirmingId, setConfirmingId] = useState<T | null>(null);

  const requestDelete = useCallback((id: T) => {
    setConfirmingId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmingId(null);
  }, []);

  const isConfirming = useCallback(
    (id: T) => confirmingId === id,
    [confirmingId]
  );

  // Returns true if delete should proceed, false if just requesting confirmation
  const handleDelete = useCallback(
    (id: T, onConfirm: () => void) => {
      if (confirmingId === id) {
        onConfirm();
        setConfirmingId(null);
      } else {
        setConfirmingId(id);
      }
    },
    [confirmingId]
  );

  return {
    confirmingId,
    isConfirming,
    requestDelete,
    cancelDelete,
    handleDelete,
  };
}
