import { Router } from 'express';
import { marketService, chartDataService } from '../services';
import { adminMiddleware, superadminMiddleware } from '../middleware/auth';
import type { BuyRequest } from 'shared';

const router = Router();

// POST /api/market/buy - Buy beer (Admin only)
router.post('/buy', adminMiddleware as any, (req, res) => {
  const { beerId, quantity } = req.body as BuyRequest;

  if (!beerId || !quantity || quantity < 1) {
    res.status(400).json({ error: 'Invalid request: beerId and quantity required' });
    return;
  }

  const result = marketService.buy(beerId, quantity);

  if (!result) {
    res.status(404).json({ error: 'Beer not found' });
    return;
  }

  res.json(result);
});

// POST /api/market/reset - Reset market (Superadmin only)
router.post('/reset', superadminMiddleware as any, (req, res) => {
  const beers = marketService.reset();
  res.json({ success: true, beers });
});

// GET /api/market/total - Get total market price
router.get('/total', (req, res) => {
  const stats = marketService.getStats();
  res.json(stats);
});

// GET /api/market/chart-data - Get chart data
router.get('/chart-data', (req, res) => {
  const chartData = chartDataService.getChartData();
  res.json(chartData);
});

export default router;
