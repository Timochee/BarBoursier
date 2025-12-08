import { useState } from 'react';
import type { Preset } from 'shared';
import { Modal, ModalHeader, ModalFooter } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';

interface PresetManagementProps {
  presets: Preset[];
  isLoading: boolean;
  onClose: () => void;
  onSaveCurrent: (data: { name: string; description?: string }) => Promise<Preset>;
  onLoad: (id: number) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function PresetManagement({
  presets,
  isLoading,
  onClose,
  onSaveCurrent,
  onLoad,
  onDelete,
  onSuccess,
  onError,
}: PresetManagementProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
  const [presetToLoad, setPresetToLoad] = useState<Preset | null>(null);

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onError('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCurrent({ name: name.trim(), description: description.trim() || undefined });
      onSuccess(`Preset "${name.trim()}" saved successfully`);
      setName('');
      setDescription('');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to save preset');
    }
    setIsSubmitting(false);
  };

  const handleLoad = async () => {
    if (!presetToLoad) return;

    setIsSubmitting(true);
    try {
      await onLoad(presetToLoad.id);
      onSuccess(`Preset "${presetToLoad.name}" loaded successfully`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load preset');
    }
    setIsSubmitting(false);
    setPresetToLoad(null);
  };

  const handleDelete = async () => {
    if (!presetToDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(presetToDelete.id);
      onSuccess(`Preset "${presetToDelete.name}" deleted`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete preset');
    }
    setIsSubmitting(false);
    setPresetToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Modal onClose={onClose} maxWidth="lg" ariaLabelledBy="preset-management-title">
        <ModalHeader
          title="Beer Presets"
          subtitle="Save and load beer configurations"
          titleId="preset-management-title"
          onClose={onClose}
          icon={
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          }
        />

        <div className="p-6 max-h-[60vh] overflow-auto">
          {/* Save Current Form */}
          <form onSubmit={handleSaveCurrent} className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Save Current Configuration
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Preset name (e.g., Bar Le Central)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                disabled={isSubmitting}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="w-full px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-50"
                style={{ background: '#06b6d4' }}
              >
                {isSubmitting ? 'Saving...' : 'Save Current Beers as Preset'}
              </button>
            </div>
          </form>

          {/* Preset List */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              Saved Presets ({presets.length})
            </h3>

            {isLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No presets saved yet
              </div>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{preset.name}</div>
                        {preset.description && (
                          <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {preset.description}
                          </div>
                        )}
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          {preset.beers.length} beers - Created {formatDate(preset.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setPresetToLoad(preset)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-cyan-500 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                          title="Load preset"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPresetToDelete(preset)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete preset"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Beer preview */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.beers.slice(0, 5).map((beer, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                          {beer.name}
                        </span>
                      ))}
                      {preset.beers.length > 5 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                          +{preset.beers.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={onClose}
            className="w-full btn py-2 rounded-lg font-medium"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>

      {/* Confirm Load Dialog */}
      {presetToLoad && (
        <ConfirmDialog
          title="Load Preset"
          message={`Loading "${presetToLoad.name}" will replace all current beers and reset the market. Continue?`}
          confirmLabel="Load"
          onConfirm={handleLoad}
          onCancel={() => setPresetToLoad(null)}
          variant="warning"
        />
      )}

      {/* Confirm Delete Dialog */}
      {presetToDelete && (
        <ConfirmDialog
          title="Delete Preset"
          message={`Are you sure you want to delete "${presetToDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setPresetToDelete(null)}
          variant="danger"
        />
      )}
    </>
  );
}
