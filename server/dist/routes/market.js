"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_1 = require("../services");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/market/buy - Buy beer (Admin only)
router.post('/buy', auth_1.adminMiddleware, (req, res) => {
    const { beerId, quantity } = req.body;
    if (!beerId || !quantity || quantity < 1) {
        res.status(400).json({ error: 'Invalid request: beerId and quantity required' });
        return;
    }
    const result = services_1.marketService.buy(beerId, quantity);
    if (!result) {
        res.status(404).json({ error: 'Beer not found' });
        return;
    }
    res.json(result);
});
// POST /api/market/reset - Reset market (Admin only)
router.post('/reset', auth_1.adminMiddleware, (req, res) => {
    const beers = services_1.marketService.reset();
    res.json({ success: true, beers });
});
// GET /api/market/total - Get total market price
router.get('/total', (req, res) => {
    const stats = services_1.marketService.getStats();
    res.json(stats);
});
// GET /api/market/chart-data - Get chart data
router.get('/chart-data', (req, res) => {
    const chartData = services_1.chartDataService.getChartData();
    res.json(chartData);
});
exports.default = router;
