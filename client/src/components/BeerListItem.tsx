import type { Beer } from 'shared';
import { CATEGORY_STYLES, getCategoryBadgeStyle } from '../utils/styles';

interface BeerListItemProps {
  beer: Beer;
  isSubmitting: boolean;
  isDeleteConfirm: boolean;
  onEdit: (beer: Beer) => void;
  onDelete: (beer: Beer) => void;
}

export function BeerListItem({
  beer,
  isSubmitting,
  isDeleteConfirm,
  onEdit,
  onDelete,
}: BeerListItemProps) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg"
      style={{ background: 'var(--bg-tertiary)' }}
    >
      <div className="flex items-center gap-3">
        <span className={`badge ${CATEGORY_STYLES[beer.category] || ''}`} style={getCategoryBadgeStyle(beer.category)}>
          {beer.category}
        </span>
        <div>
          <p className="font-medium">{beer.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {beer.basePrice.toFixed(2)} EUR · Vol: {(beer.volatility * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(beer)}
          disabled={isSubmitting}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          aria-label={`Edit ${beer.name}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(beer)}
          disabled={isSubmitting}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isDeleteConfirm
              ? 'bg-red-500 text-white'
              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
          }`}
          aria-label={isDeleteConfirm ? `Confirm delete ${beer.name}` : `Delete ${beer.name}`}
        >
          {isDeleteConfirm ? 'Confirm?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
