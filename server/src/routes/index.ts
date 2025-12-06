import { Router } from 'express';
import beersRouter from './beers';
import marketRouter from './market';
import transactionsRouter from './transactions';

const router = Router();

router.use('/beers', beersRouter);
router.use('/market', marketRouter);
router.use('/transactions', transactionsRouter);

export default router;
