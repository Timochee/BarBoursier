import { Router } from 'express';
import { beerRepository, priceHistoryRepository } from '../repositories';
import { emitBeersUpdated } from '../socket';
import { superadminMiddleware } from '../middleware/auth';
import { logger } from '../logger';
import { roundPrice, beersToRecords, validateBeerCreate, validateBeerUpdate } from '../utils/helpers';

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
router.post('/', superadminMiddleware, (req, res) => {
  const { name, basePrice, category, volatility } = req.body;

  // Validation
  const validation = validateBeerCreate({ name, basePrice, category, volatility });
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
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
      basePrice: roundPrice(basePrice),
      category,
      volatility: roundPrice(volatility),
    });

    // Record initial price in history so the beer appears correctly on the chart
    const allBeers = beerRepository.getAll();
    priceHistoryRepository.recordPrices(beersToRecords(allBeers));

    // Notify all clients about the new beer
    emitBeersUpdated();

    res.status(201).json(beer);
  } catch (error) {
    logger.error({error}, 'Error creating beer');
    res.status(500).json({ error: 'Failed to create beer' });
  }
});

// PUT /api/beers/:id - Update a beer (Superadmin only)
router.put('/:id', superadminMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, basePrice, category, volatility } = req.body;

  const existing = beerRepository.getById(id);
  if (!existing) {
    res.status(404).json({ error: 'Beer not found' });
    return;
  }

  // Validation
  const validation = validateBeerUpdate({ name, basePrice, category, volatility });
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
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
      basePrice: basePrice !== undefined ? roundPrice(basePrice) : undefined,
      category,
      volatility: volatility !== undefined ? roundPrice(volatility) : undefined,
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
router.delete('/:id', superadminMiddleware, (req, res) => {
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
router.delete('/category/:category', superadminMiddleware, (req, res) => {
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
