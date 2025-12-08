"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_1 = require("../middleware/auth");
const logger_1 = require("../logger");
const router = (0, express_1.Router)();
// GET /api/auth/google - Initiate Google OAuth
router.get('/google', (req, res, next) => {
    if (!(0, auth_1.isOAuthConfigured)()) {
        res.status(503).json({
            error: 'Google OAuth not configured',
            message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
        });
        return;
    }
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })(req, res, next);
});
// GET /api/auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', (req, res, next) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    if (!(0, auth_1.isOAuthConfigured)()) {
        res.redirect(`${clientUrl}?auth_error=${encodeURIComponent('Google OAuth not configured')}`);
        return;
    }
    passport_1.default.authenticate('google', { session: false }, (err, user) => {
        if (err) {
            logger_1.logger.error({ err }, 'Google OAuth error');
            res.redirect(`${clientUrl}?auth_error=${encodeURIComponent(err.message)}`);
            return;
        }
        if (!user) {
            res.redirect(`${clientUrl}?auth_error=Authentication failed`);
            return;
        }
        // Generate JWT token for the authenticated user
        const token = (0, auth_1.generateToken)(user);
        // Redirect to client with token
        res.redirect(`${clientUrl}?auth_token=${token}`);
    })(req, res, next);
});
// GET /api/auth/verify - Verify if token is still valid
router.get('/verify', auth_1.authMiddleware, (req, res) => {
    res.json({ valid: true, isAdmin: req.isAdmin, user: req.adminUser });
});
// POST /api/auth/logout - Logout (client-side token removal, but useful for logging)
router.post('/logout', (req, res) => {
    res.json({ success: true });
});
// GET /api/auth/status - Check if OAuth is configured
router.get('/status', (req, res) => {
    res.json({
        oauthConfigured: (0, auth_1.isOAuthConfigured)(),
    });
});
exports.default = router;
