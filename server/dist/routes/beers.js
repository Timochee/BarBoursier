"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repositories_1 = require("../repositories");
const socket_1 = require("../socket");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../logger");
const helpers_1 = require("../utils/helpers");
const router = (0, express_1.Router)();
// GET /api/beers - Get all beers
router.get('/', (req, res) => {
    const beers = repositories_1.beerRepository.getAll();
    res.json(beers);
});
// GET /api/beers/categories - Get all categories from existing beers
router.get('/categories', (req, res) => {
    const categories = repositories_1.beerRepository.getCategories();
    res.json(categories);
});
// GET /api/beers/:id - Get beer by ID
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const beer = repositories_1.beerRepository.getById(id);
    if (!beer) {
        res.status(404).json({ error: 'Beer not found' });
        return;
    }
    res.json(beer);
});
// GET /api/beers/category/:category - Get beers by category
router.get('/category/:category', (req, res) => {
    const { category } = req.params;
    const beers = repositories_1.beerRepository.getByCategory(category);
    res.json(beers);
});
// POST /api/beers - Create a new beer (Superadmin only)
router.post('/', auth_1.superadminMiddleware, (req, res) => {
    const { name, basePrice, category, volatility } = req.body;
    // Validation
    const validation = (0, helpers_1.validateBeerCreate)({ name, basePrice, category, volatility });
    if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
    }
    // Check for duplicate name
    if (repositories_1.beerRepository.exists(name.trim())) {
        res.status(409).json({ error: 'A beer with this name already exists' });
        return;
    }
    try {
        const beer = repositories_1.beerRepository.create({
            name: name.trim(),
            basePrice: (0, helpers_1.roundPrice)(basePrice),
            category,
            volatility: (0, helpers_1.roundPrice)(volatility),
        });
        // Record initial price in history so the beer appears correctly on the chart
        const allBeers = repositories_1.beerRepository.getAll();
        repositories_1.priceHistoryRepository.recordPrices((0, helpers_1.beersToRecords)(allBeers));
        // Notify all clients about the new beer
        (0, socket_1.emitBeersUpdated)(allBeers);
        res.status(201).json(beer);
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error creating beer');
        res.status(500).json({ error: 'Failed to create beer' });
    }
});
// PUT /api/beers/:id - Update a beer (Superadmin only)
router.put('/:id', auth_1.superadminMiddleware, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name, basePrice, category, volatility } = req.body;
    const existing = repositories_1.beerRepository.getById(id);
    if (!existing) {
        res.status(404).json({ error: 'Beer not found' });
        return;
    }
    // Validation
    const validation = (0, helpers_1.validateBeerUpdate)({ name, basePrice, category, volatility });
    if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
    }
    // Check for duplicate name (excluding current beer)
    if (name && repositories_1.beerRepository.exists(name.trim(), id)) {
        res.status(409).json({ error: 'A beer with this name already exists' });
        return;
    }
    try {
        const beer = repositories_1.beerRepository.update(id, {
            name: name?.trim(),
            basePrice: basePrice !== undefined ? (0, helpers_1.roundPrice)(basePrice) : undefined,
            category,
            volatility: volatility !== undefined ? (0, helpers_1.roundPrice)(volatility) : undefined,
        });
        // Notify all clients about the updated beer
        (0, socket_1.emitBeersUpdated)(repositories_1.beerRepository.getAll());
        res.json(beer);
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error updating beer');
        res.status(500).json({ error: 'Failed to update beer' });
    }
});
// DELETE /api/beers/:id - Delete a beer (Superadmin only)
router.delete('/:id', auth_1.superadminMiddleware, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const existing = repositories_1.beerRepository.getById(id);
    if (!existing) {
        res.status(404).json({ error: 'Beer not found' });
        return;
    }
    try {
        const deleted = repositories_1.beerRepository.delete(id);
        if (deleted) {
            // Notify all clients about the deleted beer
            (0, socket_1.emitBeersUpdated)(repositories_1.beerRepository.getAll());
            res.json({ success: true, message: `Beer "${existing.name}" deleted` });
        }
        else {
            res.status(500).json({ error: 'Failed to delete beer' });
        }
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error deleting beer');
        res.status(500).json({ error: 'Failed to delete beer' });
    }
});
// DELETE /api/beers/category/:category - Delete all beers in a category (Superadmin only)
router.delete('/category/:category', auth_1.superadminMiddleware, (req, res) => {
    const { category } = req.params;
    const beersInCategory = repositories_1.beerRepository.getByCategory(category);
    if (beersInCategory.length === 0) {
        res.status(404).json({ error: 'Category not found or empty' });
        return;
    }
    try {
        const deletedCount = repositories_1.beerRepository.deleteByCategory(category);
        // Notify all clients about the deleted beers
        (0, socket_1.emitBeersUpdated)(repositories_1.beerRepository.getAll());
        res.json({ success: true, message: `Category "${category}" deleted (${deletedCount} beers)`, deletedCount });
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error deleting category');
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
exports.default = router;
