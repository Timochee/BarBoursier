import { Router } from 'express';
import beersRouter from './beers';
import marketRouter from './market';
import transactionsRouter from './transactions';
import adminsRouter from './admins';
import presetsRouter from './presets';

const router = Router();

router.use('/beers', beersRouter);
router.use('/market', marketRouter);
router.use('/transactions', transactionsRouter);
router.use('/admins', adminsRouter);
router.use('/presets', presetsRouter);

export default router;
