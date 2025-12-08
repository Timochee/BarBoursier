import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { logger } from '../logger';
import { adminRepository } from '../repositories';
import type { Role } from 'shared';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();

export interface AuthUser {
  email: string;
  name: string;
  picture: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface GoogleProfile {
  id: string;
  emails?: { value: string; verified: boolean }[];
  displayName: string;
  photos?: { value: string }[];
}

// Get user role based on email
export function getUserRole(email: string): Role {
  const normalizedEmail = email.toLowerCase();

  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return 'superadmin';
  }

  if (adminRepository.isAdmin(normalizedEmail)) {
    return 'admin';
  }

  return 'guest';
}

// Check if user has at least admin privileges
export function isAdminOrAbove(role: Role): boolean {
  return role === 'admin' || role === 'superadmin';
}

// Check if OAuth credentials are properly configured
export function isOAuthConfigured(): boolean {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return !!(clientID && clientSecret && clientID !== 'your-google-client-id');
}

// Configure Google OAuth Strategy
export function configurePassport(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const serverPort = process.env.PORT || '3001';
  const callbackURL = process.env.OAUTH_CALLBACK_URL || `http://localhost:${serverPort}/api/auth/google/callback`;

  logger.info({ callbackURL, superadmin: process.env.SUPERADMIN_EMAIL }, 'OAuth config');

  if (!isOAuthConfigured()) {
    logger.warn('Google OAuth not configured');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: clientID!,
        clientSecret: clientSecret!,
        callbackURL,
      },
      (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: (error: Error | null, user?: Omit<AuthUser, 'role'> | false) => void) => {
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
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: Express.User, done) => {
    done(null, user);
  });
}

interface JWTPayload {
  email: string;
  name: string;
  picture: string;
}

// Extract and verify token from request
function extractAndVerifyToken(req: Request): { payload: JWTPayload } | { error: string; status: 401 | 403 } {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return { payload };
  } catch {
    return { error: 'Invalid token', status: 401 };
  }
}

// Populate request with user info from JWT payload (role is fetched fresh from DB)
function populateRequestFromPayload(req: AuthRequest, payload: JWTPayload): void {
  const role = getUserRole(payload.email);
  req.user = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    role,
  };
}

// JWT auth middleware - allows any authenticated user
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const result = extractAndVerifyToken(req);

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  populateRequestFromPayload(req, result.payload);
  next();
}

// Admin-only middleware - requires admin or superadmin role
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const result = extractAndVerifyToken(req);

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  populateRequestFromPayload(req, result.payload);

  if (!isAdminOrAbove(req.user!.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  next();
}

// Superadmin-only middleware
export function superadminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const result = extractAndVerifyToken(req);

  if ('error' in result) {
    res.status(result.status).json({ error: result.error });
    return;
  }

  populateRequestFromPayload(req, result.payload);

  if (req.user!.role !== 'superadmin') {
    res.status(403).json({ error: 'Superadmin access required' });
    return;
  }

  next();
}

// Generate JWT token for authenticated user
export function generateToken(user: Omit<AuthUser, 'role'>): string {
  return jwt.sign({
    email: user.email,
    name: user.name,
    picture: user.picture,
  }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token for Socket.io authentication
export function verifySocketToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const role = getUserRole(payload.email);
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role,
    };
  } catch {
    return null;
  }
}
