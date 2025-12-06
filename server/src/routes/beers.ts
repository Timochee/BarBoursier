import { Router } from 'express';
import { CATEGORIES, DEFAULT_SETTINGS } from 'shared';
import { beerRepository } from '../repositories';
import { emitBeersUpdated } from '../socket';

const router = Router();

// GET /api/beers - Get all beers
router.get('/', (req, res) => {
  const beers = beerRepository.getAll();
  res.json(beers);
});

// GET /api/beers/categories - Get all categories
router.get('/categories', (req, res) => {
  res.json(CATEGORIES);
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

// POST /api/beers - Create a new beer
router.post('/', (req, res) => {
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

  if (!category || !CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}` });
    return;
  }

  if (typeof volatility !== 'number' || volatility < 0.1 || volatility > 1) {
    res.status(400).json({ error: 'Volatility must be between 0.1 and 1.0' });
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
    console.error('Error creating beer:', error);
    res.status(500).json({ error: 'Failed to create beer' });
  }
});

// PUT /api/beers/:id - Update a beer
router.put('/:id', (req, res) => {
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

  if (basePrice !== undefined && (typeof basePrice !== 'number' || basePrice < 0.5 || basePrice > 25)) {
    res.status(400).json({ error: 'Base price must be between 0.50 and 25.00' });
    return;
  }

  if (category !== undefined && !CATEGORIES.includes(category)) {
    res.status(400).json({ error: `Category must be one of: ${CATEGORIES.join(', ')}` });
    return;
  }

  if (volatility !== undefined && (typeof volatility !== 'number' || volatility < 0.1 || volatility > 1)) {
    res.status(400).json({ error: 'Volatility must be between 0.1 and 1.0' });
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
    console.error('Error updating beer:', error);
    res.status(500).json({ error: 'Failed to update beer' });
  }
});

// DELETE /api/beers/:id - Delete a beer
router.delete('/:id', (req, res) => {
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
    console.error('Error deleting beer:', error);
    res.status(500).json({ error: 'Failed to delete beer' });
  }
});

export default router;
