import { useEffect, useRef } from 'react';
import type { PurchaseImpact } from 'shared';

interface ImpactDialogProps {
  impact: PurchaseImpact;
  onClose: () => void;
}

export function ImpactDialog({ impact, onClose }: ImpactDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  const getChangeClass = (change: number) => {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-neutral';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (change < 0) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return <span className="w-4 h-4 inline-block text-center">-</span>;
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="impact-dialog-title"
    >
      <div
        className="modal-content w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 id="impact-dialog-title" className="text-xl font-bold">Purchase Complete!</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Market impact analysis
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Purchase Info */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You bought</p>
            <p className="text-2xl font-bold mt-1">
              <span className="text-[#e94560]">{impact.quantity}x</span>{' '}
              {impact.purchasedBeerName}
            </p>
          </div>

          {/* Sector Changes */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
              Sector Impact
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(impact.sectorChanges).map(([sector, change]) => (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <span className="capitalize font-medium">{sector}</span>
                  <span className={`flex items-center gap-1 ${getChangeClass(change)}`}>
                    {getChangeIcon(change)}
                    {change > 0 ? '+' : ''}{change.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Beer Changes */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>
              Price Changes
            </h3>
            <div className="space-y-3 max-h-48 overflow-auto pr-2">
              {Object.entries(impact.beerChanges).map(([sector, beers]) => (
                <div key={sector}>
                  <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {sector}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(beers).map(([beerName, change]) => (
                      <div
                        key={beerName}
                        className="flex items-center justify-between p-2 rounded text-sm"
                        style={{ background: 'var(--bg-tertiary)' }}
                      >
                        <span className="truncate mr-2">{beerName}</span>
                        <span className={`flex items-center gap-0.5 flex-shrink-0 ${getChangeClass(change)}`}>
                          {getChangeIcon(change)}
                          {change > 0 ? '+' : ''}{change.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Continue Trading
          </button>
        </div>
      </div>
    </div>
  );
}
