import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

// Hook to handle modal escape key and focus trap
export function useModalKeyboard(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  return { dialogRef, handleKeyDown };
}

export function Modal({
  children,
  onClose,
  maxWidth = 'lg',
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const { dialogRef, handleKeyDown } = useModalKeyboard(onClose);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={dialogRef}
        className={`modal-content w-full ${maxWidthClasses[maxWidth]}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}

// Common modal header component
interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  titleId?: string;
  onClose?: () => void;
  icon?: ReactNode;
}

export function ModalHeader({ title, subtitle, titleId, onClose, icon }: ModalHeaderProps) {
  return (
    <div
      className="px-6 py-4 border-b flex items-center justify-between"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 id={titleId} className="text-xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-white/10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Common modal footer component
interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div
      className="px-6 py-4 border-t"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {children}
    </div>
  );
}
