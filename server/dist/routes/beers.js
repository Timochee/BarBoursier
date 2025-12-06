"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repositories_1 = require("../repositories");
const router = (0, express_1.Router)();
// GET /api/beers - Get all beers
router.get('/', (req, res) => {
    const beers = repositories_1.beerRepository.getAll();
    res.json(beers);
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
exports.default = router;
