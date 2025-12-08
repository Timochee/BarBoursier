import { Router } from 'express';
import beersRouter from './beers';
import marketRouter from './market';
import transactionsRouter from './transactions';
import adminsRouter from './admins';

const router = Router();

router.use('/beers', beersRouter);
router.use('/market', marketRouter);
router.use('/transactions', transactionsRouter);
router.use('/admins', adminsRouter);

export default router;
