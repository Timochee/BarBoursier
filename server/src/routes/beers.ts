import { Router } from 'express';
import { DEFAULT_SETTINGS, VALIDATION } from 'shared';
import { beerRepository } from '../repositories';
import { emitBeersUpdated } from '../socket';
import { superadminMiddleware } from '../middleware/auth';
import { logger } from '../logger';

const router = Router();

// GET /api/beers - Get all beers
router.get('/', (req, res) => {
  const beers = beerRepository.getAll();
  res.json(beers);
});

// GET /api/beers/categories - Get all categories from existing beers
router.get('/categories', (req, res) => {
  const categories = beerRepository.getCategories();
  res.json(categories);
});

// GET /api/beers/:id - Get beer by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const beer = beerRepository.getById(id);

  if (!beer) {
    res.status(404).json({ error: 'Beer not found' });
    return;
  }

  res.json(beer);
});

// GET /api/beers/category/:category - Get beers by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const beers = beerRepository.getByCategory(category);
  res.json(beers);
});

// POST /api/beers - Create a new beer (Superadmin only)
router.post('/', superadminMiddleware as any, (req, res) => {
  const { name, basePrice, category, volatility } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  if (typeof basePrice !== 'number' || basePrice < DEFAULT_SETTINGS.minPrice || basePrice > DEFAULT_SETTINGS.maxPrice) {
    res.status(400).json({ error: `Base price must be between ${DEFAULT_SETTINGS.minPrice} and ${DEFAULT_SETTINGS.maxPrice}` });
    return;
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    res.status(400).json({ error: 'Category is required' });
    return;
  }

  if (typeof volatility !== 'number' || volatility < VALIDATION.volatility.min || volatility > VALIDATION.volatility.max) {
    res.status(400).json({ error: `Volatility must be between ${VALIDATION.volatility.min} and ${VALIDATION.volatility.max}` });
    return;
  }

  // Check for duplicate name
  if (beerRepository.exists(name.trim())) {
    res.status(409).json({ error: 'A beer with this name already exists' });
    return;
  }

  try {
    const beer = beerRepository.create({
      name: name.trim(),
      basePrice: Math.round(basePrice * 100) / 100,
      category,
      volatility: Math.round(volatility * 100) / 100,
    });

    // Notify all clients about the new beer
    emitBeersUpdated();

    res.status(201).json(beer);
  } catch (error) {
    logger.error({error}, 'Error creating beer');
    res.status(500).json({ error: 'Failed to create beer' });
  }
});

// PUT /api/beers/:id - Update a beer (Superadmin only)
router.put('/:id', superadminMiddleware as any, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, basePrice, category, volatility } = req.body;

  const existing = beerRepository.getById(id);
  if (!existing) {
    res.status(404).json({ error: 'Beer not found' });
    return;
  }

  // Validation
  if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json({ error: 'Name cannot be empty' });
    return;
  }

  if (basePrice !== undefined && (typeof basePrice !== 'number' || basePrice < DEFAULT_SETTINGS.minPrice || basePrice > DEFAULT_SETTINGS.maxPrice)) {
    res.status(400).json({ error: `Base price must be between ${DEFAULT_SETTINGS.minPrice} and ${DEFAULT_SETTINGS.maxPrice}` });
    return;
  }

  if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
    res.status(400).json({ error: 'Category cannot be empty' });
    return;
  }

  if (volatility !== undefined && (typeof volatility !== 'number' || volatility < VALIDATION.volatility.min || volatility > VALIDATION.volatility.max)) {
    res.status(400).json({ error: `Volatility must be between ${VALIDATION.volatility.min} and ${VALIDATION.volatility.max}` });
    return;
  }

  // Check for duplicate name (excluding current beer)
  if (name && beerRepository.exists(name.trim(), id)) {
    res.status(409).json({ error: 'A beer with this name already exists' });
    return;
  }

  try {
    const beer = beerRepository.update(id, {
      name: name?.trim(),
      basePrice: basePrice ? Math.round(basePrice * 100) / 100 : undefined,
      category,
      volatility: volatility ? Math.round(volatility * 100) / 100 : undefined,
    });

    // Notify all clients about the updated beer
    emitBeersUpdated();

    res.json(beer);
  } catch (error) {
    logger.error({error}, 'Error updating beer');
    res.status(500).json({ error: 'Failed to update beer' });
  }
});

// DELETE /api/beers/:id - Delete a beer (Superadmin only)
router.delete('/:id', superadminMiddleware as any, (req, res) => {
  const id = parseInt(req.params.id, 10);

  const existing = beerRepository.getById(id);
  if (!existing) {
    res.status(404).json({ error: 'Beer not found' });
    return;
  }

  try {
    const deleted = beerRepository.delete(id);
    if (deleted) {
      // Notify all clients about the deleted beer
      emitBeersUpdated();

      res.json({ success: true, message: `Beer "${existing.name}" deleted` });
    } else {
      res.status(500).json({ error: 'Failed to delete beer' });
    }
  } catch (error) {
    logger.error({error}, 'Error deleting beer');
    res.status(500).json({ error: 'Failed to delete beer' });
  }
});

// DELETE /api/beers/category/:category - Delete all beers in a category (Superadmin only)
router.delete('/category/:category', superadminMiddleware as any, (req, res) => {
  const { category } = req.params;

  const beersInCategory = beerRepository.getByCategory(category);
  if (beersInCategory.length === 0) {
    res.status(404).json({ error: 'Category not found or empty' });
    return;
  }

  try {
    const deletedCount = beerRepository.deleteByCategory(category);
    // Notify all clients about the deleted beers
    emitBeersUpdated();

    res.json({ success: true, message: `Category "${category}" deleted (${deletedCount} beers)`, deletedCount });
  } catch (error) {
    logger.error({error}, 'Error deleting category');
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
