import { Router } from 'express';
import { beerRepository } from '../repositories';

const router = Router();

// GET /api/beers - Get all beers
router.get('/', (req, res) => {
  const beers = beerRepository.getAll();
  res.json(beers);
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

export default router;
