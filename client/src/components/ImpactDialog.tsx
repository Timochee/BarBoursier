import { useEffect, useRef } from 'react';
import type { PurchaseImpact } from 'shared';
import { getChangeClass, PriceChangeIcon, formatPriceChange } from '../utils/priceChange';
import { Modal, ModalHeader, ModalFooter } from './Modal';

interface ImpactDialogProps {
  impact: PurchaseImpact;
  onClose: () => void;
}

const ImpactIcon = (
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#e94560] to-[#ff6b6b] flex items-center justify-center">
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  </div>
);

export function ImpactDialog({ impact, onClose }: ImpactDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <Modal onClose={onClose} maxWidth="lg" ariaLabelledBy="impact-dialog-title">
      <ModalHeader
        title="Purchase Complete!"
        subtitle="Market impact analysis"
        titleId="impact-dialog-title"
        icon={ImpactIcon}
      />

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
                  <PriceChangeIcon change={change} />
                  {formatPriceChange(change)}
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
                        <PriceChangeIcon change={change} />
                        {formatPriceChange(change)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="btn btn-primary w-full"
        >
          Continue Trading
        </button>
      </ModalFooter>
    </Modal>
  );
}
