import { Router } from 'express';
import { transactionRepository } from '../repositories';

const router = Router();

// GET /api/transactions - Get all transactions
router.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const transactions = transactionRepository.getRecent(limit);
  res.json(transactions);
});

// GET /api/transactions/count - Get transaction count
router.get('/count', (req, res) => {
  const count = transactionRepository.getCount();
  res.json({ count });
});

export default router;
