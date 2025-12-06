import type { Beer } from 'shared';
import { CATEGORIES } from 'shared';
import { CATEGORY_STYLES, DEFAULT_VOLATILITY } from '../utils/styles';

interface BeerFormData {
  name: string;
  basePrice: string;
  category: string;
  volatility: string;
}

interface BeerFormProps {
  formData: BeerFormData;
  editingBeer: Beer | null;
  isSubmitting: boolean;
  onFormChange: (data: BeerFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export type { BeerFormData };

export function BeerForm({
  formData,
  editingBeer,
  isSubmitting,
  onFormChange,
  onSubmit,
  onCancel,
}: BeerFormProps) {
  const handleCategoryChange = (category: string) => {
    onFormChange({
      ...formData,
      category,
      volatility: editingBeer ? formData.volatility : (DEFAULT_VOLATILITY[category]?.toString() || '0.30'),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2" htmlFor="beer-name">
          Beer Name
        </label>
        <input
          id="beer-name"
          type="text"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          placeholder="e.g., Tripel Karmeliet"
          className="w-full px-4 py-3 rounded-lg"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                formData.category === cat
                  ? 'ring-2 ring-[#e94560]'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ background: 'var(--bg-tertiary)' }}
              disabled={isSubmitting}
            >
              <span className={`badge ${CATEGORY_STYLES[cat]}`}>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price and Volatility */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="beer-price">
            Base Price (EUR)
          </label>
          <input
            id="beer-price"
            type="number"
            min="0.50"
            max="25.00"
            step="0.25"
            value={formData.basePrice}
            onChange={(e) => onFormChange({ ...formData, basePrice: e.target.value })}
            className="w-full px-4 py-3 rounded-lg"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
            required
            disabled={isSubmitting}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            0.50 - 25.00 EUR
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" htmlFor="beer-volatility">
            Volatility
          </label>
          <input
            id="beer-volatility"
            type="number"
            min="0.10"
            max="1.00"
            step="0.01"
            value={formData.volatility}
            onChange={(e) => onFormChange({ ...formData, volatility: e.target.value })}
            className="w-full px-4 py-3 rounded-lg"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
            required
            disabled={isSubmitting}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            0.10 (stable) - 1.00 (volatile)
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        {editingBeer && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 btn py-3 rounded-lg font-medium"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className={`${editingBeer ? 'flex-1' : 'w-full'} btn btn-primary py-3 flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : editingBeer ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Update Beer
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Beer
            </>
          )}
        </button>
      </div>
    </form>
  );
}
