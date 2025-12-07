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
        console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
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
// JWT auth middleware - allows any authenticated user
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.adminUser = { email: decoded.email, name: decoded.name, picture: decoded.picture };
        req.isAdmin = decoded.role === 'admin' && isEmailAllowed(decoded.email);
        next();
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}
// Admin-only middleware - requires admin role
function adminMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role === 'admin' && isEmailAllowed(decoded.email)) {
            req.isAdmin = true;
            req.adminUser = { email: decoded.email, name: decoded.name, picture: decoded.picture };
            next();
        }
        else {
            res.status(403).json({ error: 'Insufficient permissions' });
        }
    }
    catch {
        res.status(401).json({ error: 'Invalid token' });
    }
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
