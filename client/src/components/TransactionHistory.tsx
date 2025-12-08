import { useRef, useEffect } from 'react';
import { useTransactions } from '../hooks';
import { Modal, ModalHeader, ModalFooter } from './Modal';

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
              <div className="animate-spin w-8 h-8 border-2 border-[#e94560] border-t-transparent rounded-full mx-auto mb-4" />
              <p style={{ color: 'var(--text-secondary)' }}>Loading transactions...</p>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Start buying beers to see your history!</p>
            </div>
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
                    <td className="p-4 text-right tabular-nums font-bold text-[#e94560]">
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
            <span className="font-bold text-[#e94560]">
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
