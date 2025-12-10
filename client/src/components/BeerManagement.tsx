import { useState, useEffect, useRef } from 'react';
import type { Beer } from 'shared';
import { CATEGORIES } from 'shared';
import { api, CreateBeerRequest, UpdateBeerRequest } from '../services/api';
import { BeerForm, type BeerFormData } from './BeerForm';
import { BeerListItem } from './BeerListItem';
import { CATEGORY_STYLES, getCategoryBadgeStyle } from '../utils/styles';
import { getErrorMessage } from '../utils/helpers';

// Fetch existing categories from the database
function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const refetch = () => {
    api.getCategories().then(setCategories).catch(() => {});
  };

  return { categories, refetch };
}

interface BeerManagementProps {
  beers: Beer[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const initialFormData: BeerFormData = {
  name: '',
  basePrice: '3.00',
  category: 'pils',
  volatility: '0.23',
};

function beerToFormData(beer: Beer): BeerFormData {
  return {
    name: beer.name,
    basePrice: beer.basePrice.toFixed(2),
    category: beer.category,
    volatility: beer.volatility.toFixed(2),
  };
}

export function BeerManagement({ beers, onClose, onSuccess, onError }: BeerManagementProps) {
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'categories'>('manage');
  const [formData, setFormData] = useState<BeerFormData>(initialFormData);
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { categories: existingCategories, refetch: refetchCategories } = useCategories();

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm !== null) {
          setDeleteConfirm(null);
        } else if (deleteCategoryConfirm !== null) {
          setDeleteCategoryConfirm(null);
        } else if (editingBeer !== null) {
          cancelEdit();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, deleteConfirm, deleteCategoryConfirm, editingBeer]);

  const startEdit = (beer: Beer) => {
    setEditingBeer(beer);
    setFormData(beerToFormData(beer));
    setActiveTab('add');
    setDeleteConfirm(null);
  };

  const cancelEdit = () => {
    setEditingBeer(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingBeer) {
        const updateData: UpdateBeerRequest = {};

        if (formData.name.trim() !== editingBeer.name) {
          updateData.name = formData.name.trim();
        }
        if (parseFloat(formData.basePrice) !== editingBeer.basePrice) {
          updateData.basePrice = parseFloat(formData.basePrice);
        }
        if (formData.category !== editingBeer.category) {
          updateData.category = formData.category;
        }
        if (parseFloat(formData.volatility) !== editingBeer.volatility) {
          updateData.volatility = parseFloat(formData.volatility);
        }

        await api.updateBeer(editingBeer.id, updateData);
        onSuccess(`Beer "${formData.name.trim()}" updated successfully!`);
        cancelEdit();
        refetchCategories();
      } else {
        const beerData: CreateBeerRequest = {
          name: formData.name.trim(),
          basePrice: parseFloat(formData.basePrice),
          category: formData.category,
          volatility: parseFloat(formData.volatility),
        };

        await api.createBeer(beerData);
        onSuccess(`Beer "${beerData.name}" added successfully!`);
        setFormData(initialFormData);
        refetchCategories();
      }
    } catch (error) {
      onError(getErrorMessage(error, editingBeer ? 'Failed to update beer' : 'Failed to add beer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (beer: Beer) => {
    if (deleteConfirm !== beer.id) {
      setDeleteConfirm(beer.id);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.deleteBeer(beer.id);
      onSuccess(`Beer "${beer.name}" deleted successfully!`);
      setDeleteConfirm(null);
      refetchCategories();
    } catch (error) {
      onError(getErrorMessage(error, 'Failed to delete beer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (deleteCategoryConfirm !== category) {
      setDeleteCategoryConfirm(category);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.deleteCategory(category);
      onSuccess(result.message);
      setDeleteCategoryConfirm(null);
      refetchCategories();
    } catch (error) {
      onError(getErrorMessage(error, 'Failed to delete category'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count beers per category
  const beerCountByCategory = beers.reduce((acc, beer) => {
    acc[beer.category] = (acc[beer.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedBeers = [...beers].sort((a, b) => {
    const catOrder = CATEGORIES.indexOf(a.category as typeof CATEGORIES[number]) - CATEGORIES.indexOf(b.category as typeof CATEGORIES[number]);
    if (catOrder !== 0) return catOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beer-management-title"
    >
      <div
        className="modal-content w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 id="beer-management-title" className="text-xl font-bold">Manage Beers</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Add or remove beers from the market
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => {
              if (editingBeer) cancelEdit();
              setActiveTab('manage');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manage'
                ? 'text-accent border-b-2 border-accent'
                : 'hover:bg-white/5'
            }`}
            style={{ color: activeTab === 'manage' ? undefined : 'var(--text-secondary)' }}
          >
            Beers ({beers.length})
          </button>
          <button
            onClick={() => {
              if (editingBeer) cancelEdit();
              setActiveTab('add');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'add'
                ? 'text-accent border-b-2 border-accent'
                : 'hover:bg-white/5'
            }`}
            style={{ color: activeTab === 'add' ? undefined : 'var(--text-secondary)' }}
          >
            {editingBeer ? `Edit: ${editingBeer.name}` : 'Add Beer'}
          </button>
          <button
            onClick={() => {
              if (editingBeer) cancelEdit();
              setActiveTab('categories');
              setDeleteCategoryConfirm(null);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-accent border-b-2 border-accent'
                : 'hover:bg-white/5'
            }`}
            style={{ color: activeTab === 'categories' ? undefined : 'var(--text-secondary)' }}
          >
            Categories ({existingCategories.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-auto">
          {activeTab === 'add' ? (
            <BeerForm
              formData={formData}
              editingBeer={editingBeer}
              isSubmitting={isSubmitting}
              existingCategories={existingCategories}
              onFormChange={setFormData}
              onSubmit={handleSubmit}
              onCancel={cancelEdit}
            />
          ) : activeTab === 'categories' ? (
            <div className="space-y-2">
              {existingCategories.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  No categories yet
                </p>
              ) : (
                existingCategories.map((category) => (
                  <div
                    key={category}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`badge capitalize ${CATEGORY_STYLES[category] || ''}`} style={getCategoryBadgeStyle(category, existingCategories)}>
                        {category}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {beerCountByCategory[category] || 0} beer{(beerCountByCategory[category] || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={isSubmitting}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        deleteCategoryConfirm === category
                          ? 'bg-red-500 text-white'
                          : 'text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {deleteCategoryConfirm === category ? 'Confirm Delete' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
              {existingCategories.length > 0 && (
                <p className="text-xs mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                  Deleting a category will remove all beers in that category
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedBeers.length === 0 ? (
                <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  No beers in the market
                </p>
              ) : (
                sortedBeers.map((beer) => (
                  <BeerListItem
                    key={beer.id}
                    beer={beer}
                    isSubmitting={isSubmitting}
                    isDeleteConfirm={deleteConfirm === beer.id}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    allCategories={existingCategories}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-full btn py-2 rounded-lg font-medium"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
