import { useRef, useEffect } from 'react';
import { useModalKeyboard } from './Modal';
import { WarningIcon, InfoIcon } from './Icons';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const iconMap = {
  danger: <WarningIcon className="w-6 h-6" />,
  warning: <InfoIcon className="w-6 h-6" />,
  info: <InfoIcon className="w-6 h-6" />,
};

const colorMap = {
  danger: {
    icon: 'bg-red-500/20 text-red-400',
    button: 'bg-red-500 hover:bg-red-600 text-white',
  },
  warning: {
    icon: 'bg-amber-500/20 text-amber-400',
    button: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  info: {
    icon: 'bg-blue-500/20 text-blue-400',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const { dialogRef, handleKeyDown } = useModalKeyboard(onCancel);

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        ref={dialogRef}
        className="modal-content w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${colorMap[variant].icon}`}>
              {iconMap[variant]}
            </div>
            <div className="flex-1">
              <h2
                id="confirm-dialog-title"
                className="text-lg font-semibold"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="btn px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`btn px-4 py-2 rounded-lg font-medium transition-colors ${colorMap[variant].button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
