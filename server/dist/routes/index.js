"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const beers_1 = __importDefault(require("./beers"));
const market_1 = __importDefault(require("./market"));
const transactions_1 = __importDefault(require("./transactions"));
const router = (0, express_1.Router)();
router.use('/beers', beers_1.default);
router.use('/market', market_1.default);
router.use('/transactions', transactions_1.default);
exports.default = router;
