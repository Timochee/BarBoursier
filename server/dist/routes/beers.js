"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("shared");
const repositories_1 = require("../repositories");
const socket_1 = require("../socket");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../logger");
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
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    if (typeof basePrice !== 'number' || basePrice < shared_1.DEFAULT_SETTINGS.minPrice || basePrice > shared_1.DEFAULT_SETTINGS.maxPrice) {
        res.status(400).json({ error: `Base price must be between ${shared_1.DEFAULT_SETTINGS.minPrice} and ${shared_1.DEFAULT_SETTINGS.maxPrice}` });
        return;
    }
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        res.status(400).json({ error: 'Category is required' });
        return;
    }
    if (typeof volatility !== 'number' || volatility < shared_1.VALIDATION.volatility.min || volatility > shared_1.VALIDATION.volatility.max) {
        res.status(400).json({ error: `Volatility must be between ${shared_1.VALIDATION.volatility.min} and ${shared_1.VALIDATION.volatility.max}` });
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
            basePrice: Math.round(basePrice * 100) / 100,
            category,
            volatility: Math.round(volatility * 100) / 100,
        });
        // Notify all clients about the new beer
        (0, socket_1.emitBeersUpdated)();
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
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
        res.status(400).json({ error: 'Name cannot be empty' });
        return;
    }
    if (basePrice !== undefined && (typeof basePrice !== 'number' || basePrice < shared_1.DEFAULT_SETTINGS.minPrice || basePrice > shared_1.DEFAULT_SETTINGS.maxPrice)) {
        res.status(400).json({ error: `Base price must be between ${shared_1.DEFAULT_SETTINGS.minPrice} and ${shared_1.DEFAULT_SETTINGS.maxPrice}` });
        return;
    }
    if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
        res.status(400).json({ error: 'Category cannot be empty' });
        return;
    }
    if (volatility !== undefined && (typeof volatility !== 'number' || volatility < shared_1.VALIDATION.volatility.min || volatility > shared_1.VALIDATION.volatility.max)) {
        res.status(400).json({ error: `Volatility must be between ${shared_1.VALIDATION.volatility.min} and ${shared_1.VALIDATION.volatility.max}` });
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
            basePrice: basePrice ? Math.round(basePrice * 100) / 100 : undefined,
            category,
            volatility: volatility ? Math.round(volatility * 100) / 100 : undefined,
        });
        // Notify all clients about the updated beer
        (0, socket_1.emitBeersUpdated)();
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
            (0, socket_1.emitBeersUpdated)();
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
        (0, socket_1.emitBeersUpdated)();
        res.json({ success: true, message: `Category "${category}" deleted (${deletedCount} beers)`, deletedCount });
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Error deleting category');
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
exports.default = router;
