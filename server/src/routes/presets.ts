import { Router, Request, Response } from 'express';
import { presetRepository, beerRepository } from '../repositories';
import { superadminMiddleware } from '../middleware/auth';
import { getSocketIO } from '../socket';
import type { BeerDefinition } from 'shared';
import { db } from '../db/connection';

const router = Router();

// GET /api/presets - Get all presets (Superadmin only)
router.get('/', superadminMiddleware, (_req: Request, res: Response) => {
  const presets = presetRepository.getAll();
  res.json(presets);
});

// GET /api/presets/:id - Get single preset (Admin only)
router.get('/:id', superadminMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const preset = presetRepository.getById(id);

  if (!preset) {
    res.status(404).json({ error: 'Preset not found' });
    return;
  }

  res.json(preset);
});

// POST /api/presets - Create new preset (Admin only)
router.post('/', superadminMiddleware, (req: Request, res: Response) => {
  const { name, description, beers } = req.body as {
    name: string;
    description?: string;
    beers: BeerDefinition[];
  };

  if (!name || !beers || !Array.isArray(beers) || beers.length === 0) {
    res.status(400).json({ error: 'Name and beers array are required' });
    return;
  }

  if (presetRepository.exists(name)) {
    res.status(400).json({ error: 'A preset with this name already exists' });
    return;
  }

  const preset = presetRepository.create({
    name,
    description,
    beers,
    createdBy: req.user!.email,
  });

  res.status(201).json(preset);
});

// POST /api/presets/save-current - Save current beers as preset (Admin only)
router.post('/save-current', superadminMiddleware, (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description?: string };

  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  if (presetRepository.exists(name)) {
    res.status(400).json({ error: 'A preset with this name already exists' });
    return;
  }

  const preset = presetRepository.saveCurrentAsPreset(name, description, req.user!.email);
  res.status(201).json(preset);
});

// POST /api/presets/:id/load - Load a preset (replaces all beers) (Admin only)
router.post('/:id/load', superadminMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const preset = presetRepository.getById(id);

  if (!preset) {
    res.status(404).json({ error: 'Preset not found' });
    return;
  }

  // Use transaction to ensure atomic operation
  const loadPreset = db.transaction(() => {
    // Clear all existing data
    db.prepare('DELETE FROM price_history').run();
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM beers').run();
    db.prepare('UPDATE batch_counter SET current_batch = 0 WHERE id = 1').run();

    // Insert beers from preset
    const insertBeer = db.prepare(`
      INSERT INTO beers (name, base_price, current_price, category, volatility)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const beer of preset.beers) {
      insertBeer.run(beer.name, beer.basePrice, beer.basePrice, beer.category, beer.volatility);
    }

    // Record initial price history
    const beers = beerRepository.getAll();
    const insertHistory = db.prepare(`
      INSERT INTO price_history (batch_id, beer_id, price)
      VALUES (0, ?, ?)
    `);
    for (const beer of beers) {
      insertHistory.run(beer.id, beer.currentPrice);
    }
  });

  loadPreset();

  // Emit update to all clients
  const io = getSocketIO();
  const beers = beerRepository.getAll();
  if (io) {
    io.emit('pricesUpdated', beers);
    io.emit('marketReset');
  }

  res.json({ success: true, beers });
});

// PUT /api/presets/:id - Update preset (Admin only)
router.put('/:id', superadminMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, beers } = req.body as {
    name?: string;
    description?: string;
    beers?: BeerDefinition[];
  };

  if (name && presetRepository.exists(name, id)) {
    res.status(400).json({ error: 'A preset with this name already exists' });
    return;
  }

  const preset = presetRepository.update(id, { name, description, beers });

  if (!preset) {
    res.status(404).json({ error: 'Preset not found' });
    return;
  }

  res.json(preset);
});

// DELETE /api/presets/:id - Delete preset (Admin only)
router.delete('/:id', superadminMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const deleted = presetRepository.delete(id);

  if (!deleted) {
    res.status(404).json({ error: 'Preset not found' });
    return;
  }

  res.json({ success: true });
});

export default router;
