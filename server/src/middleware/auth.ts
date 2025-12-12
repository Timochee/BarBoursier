import { Request, Response, NextFunction } from 'express';
import type { Role } from 'shared';
import { verifyToken, buildAuthUser, type AuthUser, type JWTPayload } from '../services/TokenService';
import { isAdminOrAbove } from '../utils/roles';

// AuthRequest is now just an alias - Request is globally extended with user?
export type AuthRequest = Request;

// Re-export commonly used items for backward compatibility
export { AuthUser, generateToken, verifySocketToken } from '../services/TokenService';
export { getUserRole, isAdminOrAbove } from '../utils/roles';
export { configurePassport, isOAuthConfigured, type GoogleProfile } from '../services/PassportService';

// Extract and verify token from request
function extractAndVerifyToken(
  req: Request
): { payload: JWTPayload } | { error: string; status: 401 | 403 } {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return { error: 'Invalid token', status: 401 };
  }

  return { payload };
}

// Middleware factory - DRY pattern for creating auth middlewares
type RoleValidator = (role: Role) => boolean;

function createAuthMiddleware(
  roleValidator?: RoleValidator,
  errorMessage = 'Insufficient permissions'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = extractAndVerifyToken(req);

    if ('error' in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    req.user = buildAuthUser(result.payload);

    if (roleValidator && !roleValidator(req.user.role!)) {
      res.status(403).json({ error: errorMessage });
      return;
    }

    next();
  };
}

// JWT auth middleware - allows any authenticated user
export const authMiddleware = createAuthMiddleware();

// Admin-only middleware - requires admin or superadmin role
export const adminMiddleware = createAuthMiddleware(isAdminOrAbove);

// Superadmin-only middleware
export const superadminMiddleware = createAuthMiddleware(
  (role) => role === 'superadmin',
  'Superadmin access required'
);
