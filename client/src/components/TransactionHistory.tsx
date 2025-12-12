import { useRef, useEffect } from 'react';
import { useTransactions } from '../hooks';
import { Modal, ModalHeader, ModalFooter } from './Modal';
import { ClipboardIcon, LoadingSpinner } from './Icons';
import { EmptyState } from './EmptyState';

interface TransactionHistoryProps {
  onClose: () => void;
}

export function TransactionHistory({ onClose }: TransactionHistoryProps) {
  const { data: transactions, isLoading } = useTransactions(100);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <Modal onClose={onClose} maxWidth="4xl" ariaLabelledBy="history-dialog-title">
      <ModalHeader
        title="Transaction History"
        subtitle={`${transactions?.length || 0} transactions recorded`}
        titleId="history-dialog-title"
        onClose={onClose}
      />

        {/* Content */}
        <div className="overflow-auto max-h-[60vh]">
          {isLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
              <p style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
            </div>
          ) : transactions?.length === 0 ? (
            <EmptyState
              icon={<ClipboardIcon className="w-16 h-16" />}
              title="No transactions yet"
              message="Start buying beers to see your history!"
            />
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 table-header">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    #
                  </th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Beer
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Qty
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Unit Price
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Total
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((tx, index) => (
                  <tr key={tx.id} className="table-row">
                    <td className="p-4 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {transactions.length - index}
                    </td>
                    <td className="p-4">
                      <span className="font-medium">{tx.beerName}</span>
                    </td>
                    <td className="p-4 text-right tabular-nums">
                      <span className="px-2 py-1 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)' }}>
                        x{tx.quantity}
                      </span>
                    </td>
                    <td className="p-4 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {tx.unitPrice.toFixed(2)} EUR
                    </td>
                    <td className="p-4 text-right tabular-nums font-bold text-accent">
                      {tx.totalPrice.toFixed(2)} EUR
                    </td>
                    <td className="p-4 text-right text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      <ModalFooter>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Total spent:{' '}
            <span className="font-bold text-accent">
              {transactions?.reduce((sum, tx) => sum + tx.totalPrice, 0).toFixed(2) || '0.00'} EUR
            </span>
          </p>
          <button ref={closeButtonRef} onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
