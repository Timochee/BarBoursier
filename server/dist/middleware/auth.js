"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmailAllowed = isEmailAllowed;
exports.isOAuthConfigured = isOAuthConfigured;
exports.configurePassport = configurePassport;
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const logger_1 = require("../logger");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
// Check if email is in the admin whitelist
function isEmailAllowed(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
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
    // In development, callback goes to server directly; in production, adjust as needed
    const callbackURL = process.env.OAUTH_CALLBACK_URL || `http://localhost:${serverPort}/api/auth/google/callback`;
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
        // Allow any Google user to login, admin check is done separately
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
// Extract and verify token from request (DRY - used by both middlewares)
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
// Populate request with user info from JWT payload
function populateRequestFromPayload(req, payload) {
    req.adminUser = { email: payload.email, name: payload.name, picture: payload.picture };
    req.isAdmin = payload.role === 'admin' && isEmailAllowed(payload.email);
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
// Admin-only middleware - requires admin role
function adminMiddleware(req, res, next) {
    const result = extractAndVerifyToken(req);
    if ('error' in result) {
        res.status(result.status).json({ error: result.error });
        return;
    }
    const { payload } = result;
    const isAdmin = payload.role === 'admin' && isEmailAllowed(payload.email);
    if (!isAdmin) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
    }
    populateRequestFromPayload(req, payload);
    next();
}
// Generate JWT token for authenticated user
function generateToken(user) {
    const isAdmin = isEmailAllowed(user.email);
    return jsonwebtoken_1.default.sign({
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: isAdmin ? 'admin' : 'user'
    }, JWT_SECRET, { expiresIn: '7d' });
}
