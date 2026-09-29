import { Router } from 'express';
import { marketService, chartDataService, BUY_ERROR_MESSAGES, type BuyError } from '../services';
import { adminMiddleware, superadminMiddleware } from '../middleware/auth';
import type { BuyRequest } from 'shared';

const router = Router();

const BUY_ERROR_STATUS: Record<BuyError, number> = {
  invalid_quantity: 400,
  beer_not_found: 404,
};

// POST /api/market/buy - Buy beer (Admin only)
router.post('/buy', adminMiddleware, (req, res) => {
  const { beerId, quantity } = req.body as BuyRequest;
  const outcome = marketService.buy(beerId, quantity);

  if (!outcome.ok) {
    res.status(BUY_ERROR_STATUS[outcome.error]).json({ error: BUY_ERROR_MESSAGES[outcome.error] });
    return;
  }

  res.json(outcome.result);
});

// POST /api/market/reset - Reset market (Superadmin only)
router.post('/reset', superadminMiddleware, (req, res) => {
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
