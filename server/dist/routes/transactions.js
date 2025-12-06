"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repositories_1 = require("../repositories");
const router = (0, express_1.Router)();
// GET /api/transactions - Get all transactions
router.get('/', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const transactions = repositories_1.transactionRepository.getRecent(limit);
    res.json(transactions);
});
// GET /api/transactions/count - Get transaction count
router.get('/count', (req, res) => {
    const count = repositories_1.transactionRepository.getCount();
    res.json({ count });
});
exports.default = router;
