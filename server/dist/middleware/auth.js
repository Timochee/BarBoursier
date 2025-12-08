"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRole = getUserRole;
exports.isAdminOrAbove = isAdminOrAbove;
exports.isOAuthConfigured = isOAuthConfigured;
exports.configurePassport = configurePassport;
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.superadminMiddleware = superadminMiddleware;
exports.generateToken = generateToken;
exports.verifySocketToken = verifySocketToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const logger_1 = require("../logger");
const repositories_1 = require("../repositories");
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
// Get user role based on email
function getUserRole(email) {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail === SUPERADMIN_EMAIL) {
        return 'superadmin';
    }
    if (repositories_1.adminRepository.isAdmin(normalizedEmail)) {
        return 'admin';
    }
    return 'guest';
}
// Check if user has at least admin privileges
function isAdminOrAbove(role) {
    return role === 'admin' || role === 'superadmin';
}
// Check if OAuth credentials are properly configured
function isOAuthConfigured() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return !!(clientID && clientSecret && clientID !== 'your-google-client-id');
}
// Configure Google OAuth Strategy
function configurePassport() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const serverPort = process.env.PORT || '3001';
    const callbackURL = process.env.OAUTH_CALLBACK_URL || `http://localhost:${serverPort}/api/auth/google/callback`;
    logger_1.logger.info({ callbackURL, superadmin: process.env.SUPERADMIN_EMAIL }, 'OAuth config');
    if (!isOAuthConfigured()) {
        logger_1.logger.warn('Google OAuth not configured');
        return;
    }
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL,
    }, (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found in Google profile'));
        }
        const user = {
            email,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value || '',
        };
        return done(null, user);
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser((user, done) => {
        done(null, user);
    });
}
// Extract and verify token from request
function extractAndVerifyToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'No token provided', status: 401 };
    }
    try {
        const token = authHeader.substring(7);
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return { payload };
    }
    catch {
        return { error: 'Invalid token', status: 401 };
    }
}
// Populate request with user info from JWT payload (role is fetched fresh from DB)
function populateRequestFromPayload(req, payload) {
    const role = getUserRole(payload.email);
    req.user = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role,
    };
}
// JWT auth middleware - allows any authenticated user
function authMiddleware(req, res, next) {
    const result = extractAndVerifyToken(req);
    if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
    }
    populateRequestFromPayload(req, result.payload);
    next();
}
// Admin-only middleware - requires admin or superadmin role
function adminMiddleware(req, res, next) {
    const result = extractAndVerifyToken(req);
    if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
    }
    populateRequestFromPayload(req, result.payload);
    if (!isAdminOrAbove(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
    }
    next();
}
// Superadmin-only middleware
function superadminMiddleware(req, res, next) {
    const result = extractAndVerifyToken(req);
    if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
    }
    populateRequestFromPayload(req, result.payload);
    if (req.user.role !== 'superadmin') {
        res.status(403).json({ error: 'Superadmin access required' });
        return;
    }
    next();
}
// Generate JWT token for authenticated user
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        email: user.email,
        name: user.name,
        picture: user.picture,
    }, JWT_SECRET, { expiresIn: '7d' });
}
// Verify JWT token for Socket.io authentication
function verifySocketToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const role = getUserRole(payload.email);
        return {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            role,
        };
    }
    catch {
        return null;
    }
}
