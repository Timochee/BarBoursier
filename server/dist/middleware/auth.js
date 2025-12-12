"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superadminMiddleware = exports.adminMiddleware = exports.authMiddleware = exports.isOAuthConfigured = exports.configurePassport = exports.isAdminOrAbove = exports.getUserRole = exports.verifySocketToken = exports.generateToken = void 0;
const TokenService_1 = require("../services/TokenService");
const roles_1 = require("../utils/roles");
// Re-export commonly used items for backward compatibility
var TokenService_2 = require("../services/TokenService");
Object.defineProperty(exports, "generateToken", { enumerable: true, get: function () { return TokenService_2.generateToken; } });
Object.defineProperty(exports, "verifySocketToken", { enumerable: true, get: function () { return TokenService_2.verifySocketToken; } });
var roles_2 = require("../utils/roles");
Object.defineProperty(exports, "getUserRole", { enumerable: true, get: function () { return roles_2.getUserRole; } });
Object.defineProperty(exports, "isAdminOrAbove", { enumerable: true, get: function () { return roles_2.isAdminOrAbove; } });
var PassportService_1 = require("../services/PassportService");
Object.defineProperty(exports, "configurePassport", { enumerable: true, get: function () { return PassportService_1.configurePassport; } });
Object.defineProperty(exports, "isOAuthConfigured", { enumerable: true, get: function () { return PassportService_1.isOAuthConfigured; } });
// Extract and verify token from request
function extractAndVerifyToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: 'No token provided', status: 401 };
    }
    const token = authHeader.substring(7);
    const payload = (0, TokenService_1.verifyToken)(token);
    if (!payload) {
        return { error: 'Invalid token', status: 401 };
    }
    return { payload };
}
function createAuthMiddleware(roleValidator, errorMessage = 'Insufficient permissions') {
    return (req, res, next) => {
        const result = extractAndVerifyToken(req);
        if ('error' in result) {
            res.status(result.status).json({ error: result.error });
            return;
        }
        req.user = (0, TokenService_1.buildAuthUser)(result.payload);
        if (roleValidator && !roleValidator(req.user.role)) {
            res.status(403).json({ error: errorMessage });
            return;
        }
        next();
    };
}
// JWT auth middleware - allows any authenticated user
exports.authMiddleware = createAuthMiddleware();
// Admin-only middleware - requires admin or superadmin role
exports.adminMiddleware = createAuthMiddleware(roles_1.isAdminOrAbove);
// Superadmin-only middleware
exports.superadminMiddleware = createAuthMiddleware((role) => role === 'superadmin', 'Superadmin access required');
