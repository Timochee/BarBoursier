import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { BeerDefinition } from 'shared';

export function usePresets() {
  const queryClient = useQueryClient();

  const { data: presets = [], isLoading, error } = useQuery({
    queryKey: ['presets'],
    queryFn: api.getPresets,
  });

  const createPresetMutation = useMutation({
    mutationFn: ({ name, description, beers }: { name: string; description?: string; beers: BeerDefinition[] }) =>
      api.createPreset(name, description, beers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const saveCurrentMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.saveCurrentAsPreset(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const loadPresetMutation = useMutation({
    mutationFn: (id: number) => api.loadPreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updatePresetMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string; beers?: BeerDefinition[] } }) =>
      api.updatePreset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: number) => api.deletePreset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  return {
    presets,
    isLoading,
    error,
    createPreset: createPresetMutation.mutateAsync,
    saveCurrent: saveCurrentMutation.mutateAsync,
    loadPreset: loadPresetMutation.mutateAsync,
    updatePreset: updatePresetMutation.mutateAsync,
    deletePreset: deletePresetMutation.mutateAsync,
    isCreating: createPresetMutation.isPending,
    isSaving: saveCurrentMutation.isPending,
    isLoadingPreset: loadPresetMutation.isPending,
    isUpdating: updatePresetMutation.isPending,
    isDeleting: deletePresetMutation.isPending,
  };
}
